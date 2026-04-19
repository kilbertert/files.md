const {test, expect} = require('@playwright/test');

test.beforeEach(async ({page}) => {
    await page.goto('/index.html');

    // await page.waitForSelector('.CodeMirror', {timeout: 10000});
    await page.waitForSelector('#tree', {timeout: 5000});
});

test('should load the Files.md editor', async ({page}) => {
    await expect(page).toHaveTitle('Files.md (Beta version)');

    await expect(page.locator('#sidebar')).toBeVisible();
    await expect(page.locator('#open-folder')).toBeVisible();
});

test('should open markdown file via quick panel and see bold text formatting', async ({page}) => {
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+k`);

    await page.waitForSelector('#search', {timeout: 3000});
    await page.locator('#search-input').fill('Markdown');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(1000);

    const codeMirrorContent = await page.locator('.CodeMirror').textContent();

    expect(codeMirrorContent).toContain('**Bold text**');
    expect(codeMirrorContent).toContain('**bold**');
    expect(codeMirrorContent).toContain('__bold__');

    await expect(page.locator('.CodeMirror')).toContainText('Bold text');
    await expect(page.locator('.CodeMirror')).toContainText('**bold**');

    await expect(page.locator('.CodeMirror')).toContainText('using');
});

test('insert link', async ({page}) => {
    const isMac = process.platform === 'darwin';
    const modifier = isMac ? 'Meta' : 'Control';

    await page.click('#sidebar >> text=Welcome');

    await page.click('.CodeMirror');
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Delete');
    await page.keyboard.type('[markdown');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(500);
    const content = await page.locator('.CodeMirror-code').textContent();

    console.log('Content:', content);
    expect(content).toContain('[Markdown Guide](/Markdown%20Guide.md)');
});

test('should handle text selection correctly', async ({page}) => {
    // Add some test content with various markdown elements
    await page.click('#sidebar >> text=Welcome');
    await page.waitForTimeout(500);
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');

    const testContent = `# Heading
**Bold text** and normal text
\`inline code\` with more text
[Link text](url)`;

    await page.keyboard.type(testContent);
    await page.waitForTimeout(500);

    // Test 1: Select all text
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(500);

    // Check if selection div is created with proper positioning
    const allSelections = page.locator('.CodeMirror-selected');
    let count = await allSelections.count();
    expect(count).toEqual(4);

    const expectedSelections = [
        { left: 2, width: 139, right: 141 },
        { left: 2, width: 95, right: 97 },
        { left: 2, width: 188, right: 190 },
        { left: 2, width: 223, right: 225 },
    ];

    for (let i = 0; i < count; i++) {
        const selection = allSelections.nth(i);

        const selectionData = await selection.evaluate(el => {
            const style = window.getComputedStyle(el);
            const left = parseInt(style.left);
            const width = parseInt(style.width);
            return {
                left: left,
                width: width,
                right: left + width
            };
        });

        expect(selectionData.left).toBe(expectedSelections[i].left);
        expect(selectionData.width).toBe(expectedSelections[i].width);
        expect(selectionData.right).toBe(expectedSelections[i].right);
    }
});

test('should handle text selection for word-wrap content', async ({page}) => {
    // Add some test content with various markdown elements
    await page.click('#sidebar >> text=Welcome');
    await page.waitForSelector('.CodeMirror');
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Delete');
    await page.waitForTimeout(200);

    const testContent = `Lorem ipsum dolor\nLorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

    await page.keyboard.type(testContent);
    await page.waitForTimeout(500);

    // Test 1: Select all text
    await page.keyboard.press('Control+a');
    await page.waitForTimeout(200);

    // Check if selection div is created with proper positioning
    const allSelections = page.locator('.CodeMirror-selected');
    let count = await allSelections.count();
    expect(count).toEqual(10);

    const expectedSelections = [
        { left: 2, width: 138, right: 140 },
        { left: 2, width: 742, right: 744 },
        { left: 2, width: 740, right: 742 },
        { left: 2, width: 753, right: 755 },
        { left: 2, width: 738, right: 740 },
        { left: 2, width: 718, right: 720 },
        { left: 2, width: 746, right: 748 },
        { left: 2, width: 702, right: 704 },
        { left: 2, width: 691, right: 693 },
        { left: 2, width: 503, right: 505 },
    ];

    for (let i = 0; i < count; i++) {
        const selection = allSelections.nth(i);

        const selectionData = await selection.evaluate(el => {
            const style = window.getComputedStyle(el);
            const left = parseInt(style.left);
            const width = parseInt(style.width);
            return {
                left: left,
                width: width,
                right: left + width
            };
        });

        expect(selectionData.left).toBe(expectedSelections[i].left);
        expect(selectionData.width).toBe(expectedSelections[i].width);
        expect(selectionData.right).toBe(expectedSelections[i].right);
    }
});

test('opening link in editor2 should not clobber main editor when stale editor2 has out-of-sync content', async ({page}) => {
    await page.evaluate(async () => {
        // Seed OPFS once, so external modifications aren't clobbered by repeated setup.
        const seedRoot = await navigator.storage.getDirectory();
        const hapDir = await seedRoot.getDirectoryHandle('hap', {create: true});
        const lifeDir = await seedRoot.getDirectoryHandle('life', {create: true});

        const write = async (dir, name, content) => {
            const handle = await dir.getFileHandle(name, {create: true});
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
        };

        await write(hapDir, 'Dream.md', 'Dream body [Awareness](Awareness.md)');
        await write(hapDir, 'Awareness.md', 'Awareness body');
        await write(lifeDir, 'Pilaf.md', 'Pilaf recipe');
        await write(lifeDir, 'Recipes.md', 'Recipes list [Pilaf](Pilaf.md)');

        window.getRootDirHandle = async function () {
            return await navigator.storage.getDirectory();
        };
    });

    await page.evaluate(() => {
        init(document.getElementById('editor'));
    });

    await page.waitForTimeout(500);

    const nodeSel = (name) => `#tree .tj_description:text-is('${name}')`;
    const expand = async (dir) => {
        const locator = page.locator(nodeSel(dir));
        const isExpanded = await locator.evaluate(el => el.classList.contains('expanded'));
        if (!isExpanded) {
            await locator.click();
            await page.waitForTimeout(100);
        }
    };

    // 1) Open Recipes in the main editor
    await expand('life');
    await page.click(nodeSel('Recipes'));
    await page.waitForTimeout(300);

    // 2) Click Pilaf link — opens Pilaf in editor2
    await page.evaluate(() => editor.hmdReadLink('Pilaf'));
    await page.waitForTimeout(500);

    // 3) Press Escape — editor2 is hidden but editor2.path stays = life/Pilaf.md
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // 4) Modify Pilaf on disk from outside the editor (simulates server sync)
    await page.evaluate(async () => {
        const root = await navigator.storage.getDirectory();
        const lifeDir = await root.getDirectoryHandle('life');
        const handle = await lifeDir.getFileHandle('Pilaf.md');
        const writable = await handle.createWritable();
        await writable.write('Pilaf recipe UPDATED externally');
        await writable.close();
    });
    await page.waitForTimeout(200);

    // 5) Open Dream in main editor
    await expand('hap');
    await page.click(nodeSel('Dream'));
    await page.waitForTimeout(300);

    // 6) Click Awareness link — should open in editor2
    await page.evaluate(() => editor.hmdReadLink('Awareness'));
    await page.waitForTimeout(1000);

    // Main editor must still hold Dream, not be poisoned with Pilaf content.
    const state = await page.evaluate(() => ({
        editorPath: editor.path,
        editorContent: editor.getValue(),
        editor2Path: editor2.path,
        editor2Content: editor2.getValue(),
    }));
    expect(state.editorPath).toBe('/hap/Dream.md');
    expect(state.editorContent).toBe('# Dream\nDream body [Awareness](Awareness.md)');
    expect(state.editor2Path).toBe('/hap/Awareness.md');
    expect(state.editor2Content).toBe('# Awareness\nAwareness body');
});

// Regression test for a destructive file-duplication cascade.
//
// --- Where the drift happened ---
//
// The decisive line is web/files.js:1028 in the parent openFile, but you
// have to look at what currentEditor points to when it runs. Setting the
// stage for pre-fix code:
//
// Just before the click on Awareness:
//   - editor.path = /hap/Dream.md, editor content = Dream
//   - editor2.path = /life/Pilaf.md, editor2 content = stale Pilaf
//   - disk /life/Pilaf.md was externally updated
//
// Click on Awareness fires openFile('/hap/Awareness.md', true,
// 'editor2-textarea') (call this P for parent):
//
//   1. P:977 — currentEditor = editor2. Good.
//   2. P:982 — editor2.path ≠ Awareness, so await syncCurrentEditor(false).
//      Control leaves P here.
//   3. Inside that syncCurrentEditor: path = /life/Pilaf.md. Disk differs
//      from editor2 cache. editor2 is clean. Enters the reload branch and
//      calls await openFile('/life/Pilaf.md', false) — no el argument,
//      defaults to 'editor-textarea'. Call this N for nested.
//   4. Inside N: el === 'editor-textarea' → N:976 sets currentEditor =
//      editor. Then loads disk Pilaf into editor. N:1038 reassigns
//      currentEditor = editor again after reinit. N:1047 sets editor.path
//      = /life/Pilaf.md. N returns.
//   5. Control unwinds back through syncCurrentEditor, and then to P:984
//      ("Finished syncing previous file").
//
// At this exact moment:
//   - currentEditor is editor (main) — reassigned by N. P never noticed.
//   - editor.path = /life/Pilaf.md, editor content = Pilaf UPDATED
//   - P's local variables still say path = /hap/Awareness.md, el =
//     'editor2-textarea'
//
//   6. P:1028 — currentEditor.path = path — writes editor.path =
//      /hap/Awareness.md. This is where the drift is sealed. editor's
//      content is still Pilaf; its .path is now Awareness.
//   7. P:1037–1044 — branches on el === 'editor2-textarea', so it
//      reinitializes editor2 only, not editor. Loads Awareness into
//      editor2.
//   8. P returns.
//
// State after P returns:
//   - editor — path = /hap/Awareness.md, content = Pilaf. Poisoned.
//   - editor2 — path = /hap/Awareness.md, content = Awareness. Clean.
//
// --- Why the copy happened later ---
//
// The rename-from-header block at files.js:1152–1219 triggers whenever
// syncCurrentEditor runs against the poisoned editor. That requires two
// things:
//
//   1. The periodic saver (setInterval(..., 1000ms) at files.js:1662)
//      fires.
//   2. Global currentEditor points at the poisoned editor at that moment.
//
// (2) is the trigger. editor.js:47 reassigns currentEditor on any focus
// event. In the original session, focus returned to the main editor at
// some point (the user probably clicked on it when they saw the unexpected
// Pilaf content). Next saver tick:
//   - path = editor.path = /hap/Awareness.md
//   - firstLine = '# Pilaf', filename = 'Awareness.md'
//     → hasFilenameChanged === true
//   - remove('/hap/Awareness.md') → Awareness deleted
//   - writeIfContentIsDifferent('/hap/Pilaf.md', ...) with the Pilaf
//     content → hap/Pilaf.md created
//
// That's what the server log showed:
//   Creating one clientFile: '/happiness/Плов, Pilaf.md' at 07:19:39,
//   deleting file: 'happiness/0 Осознанное расслабление.md' at 07:19:46.
//
// --- The root cause in one line ---
//
// openFile kept setting .path on the global currentEditor without
// re-verifying that currentEditor still pointed at the slot it targeted
// (el). The await at P:983 surrendered control, a nested openFile rotated
// the global, and P:1028 wrote the new path onto the wrong editor
// instance.
//
// The current switchAwayEditor fix prevents the nested openFile from ever
// running, so the rotation doesn't happen, so P:1028 ends up writing onto
// the correct editor. It blocks this specific door. It does not disarm
// the executioner (rename-from-header), nor does it fix the "P doesn't
// re-verify currentEditor" problem — any future code path that rotates
// currentEditor during P's await would poison again.
test.only('pilaf should not be copied to happiness when opening link in editor2 after stale editor2 drift', async ({page}) => {
    await page.evaluate(async () => {
        const seedRoot = await navigator.storage.getDirectory();
        const hapDir = await seedRoot.getDirectoryHandle('hap', {create: true});
        const lifeDir = await seedRoot.getDirectoryHandle('life', {create: true});

        const write = async (dir, name, content) => {
            const handle = await dir.getFileHandle(name, {create: true});
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
        };

        await write(hapDir, 'Dream.md', 'Dream body [Awareness](Awareness.md)');
        await write(hapDir, 'Awareness.md', 'Awareness body');
        await write(lifeDir, 'Pilaf.md', 'Pilaf recipe');
        await write(lifeDir, 'Recipes.md', 'Recipes list [Pilaf](Pilaf.md)');

        window.getRootDirHandle = async function () {
            return await navigator.storage.getDirectory();
        };
    });

    await page.evaluate(() => {
        init(document.getElementById('editor'));
    });

    await page.waitForTimeout(500);

    const nodeSel = (name) => `#tree .tj_description:text-is('${name}')`;
    const expand = async (dir) => {
        const locator = page.locator(nodeSel(dir));
        const isExpanded = await locator.evaluate(el => el.classList.contains('expanded'));
        if (!isExpanded) {
            await locator.click();
            await page.waitForTimeout(100);
        }
    };

    await expand('life');
    await page.click(nodeSel('Recipes'));
    await page.waitForTimeout(300);

    await page.evaluate(() => editor.hmdReadLink('Pilaf'));
    await page.waitForTimeout(500);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await page.evaluate(async () => {
        const root = await navigator.storage.getDirectory();
        const lifeDir = await root.getDirectoryHandle('life');
        const handle = await lifeDir.getFileHandle('Pilaf.md');
        const writable = await handle.createWritable();
        await writable.write('Pilaf recipe UPDATED externally');
        await writable.close();
    });
    await page.waitForTimeout(200);

    await expand('hap');
    await page.click(nodeSel('Dream'));
    await page.waitForTimeout(300);

    await page.evaluate(() => editor.hmdReadLink('Awareness'));

    // Wait past the periodic saver (CURRENT_FILE_SYNC_INTERVAL = 1000ms) so any
    // pending rename-from-header operation would have fired by now.
    await page.waitForTimeout(2000);

    const disk = await page.evaluate(async () => {
        const root = await navigator.storage.getDirectory();
        const listDir = async (name) => {
            const dir = await root.getDirectoryHandle(name);
            const names = [];
            for await (const entry of dir.values()) {
                names.push(entry.name);
            }
            return names.sort();
        };
        return {
            hap: await listDir('hap'),
            life: await listDir('life'),
        };
    });

    expect(disk.hap).toEqual(['Awareness.md', 'Dream.md']);
    expect(disk.life).toEqual(['Pilaf.md', 'Recipes.md']);
});

test('should handle partical text selection for word-wrap content', async ({page}) => {
    await page.click('#sidebar >> text=Welcome');
    await page.waitForTimeout(500);
    await page.keyboard.press('Meta+a');
    await page.keyboard.press('Delete');

    const testContent = `\`1400–1500\` Рассвет эпохи возрождения (особенно Флоренция, Рим, Венеция). Человек в центре. Развитие гуманизма: акцент на личность, разум, творчество человека. Наука и открытия расцвет астрономии, анатомии, математики (Коперник, Галилей, Леонардо да Винчи). Искусство – новые методы перспективы, реализма, анатомической точности. Великие художники: Леонардо, Микеланджело, Рафаэль, Боттичелли.`;

    await page.keyboard.type(testContent);
    await page.waitForTimeout(500);

    await page.evaluate(() => {
        editor.setSelection(
            { line: 1, ch: 84 },
            { line: 1, ch: 184 }
        );
    });
    await page.waitForTimeout(800);

    const allSelections = page.locator('.CodeMirror-selected');
    let count = await allSelections.count();
    expect(count).toEqual(2);

    const expectedSelections = [
        { left: 697, width: 62, right: 759 },
        { left: 2, width: 752, right: 754 },
    ];

    for (let i = 0; i < count; i++) {
        const selection = allSelections.nth(i);

        const selectionData = await selection.evaluate(el => {
            const style = window.getComputedStyle(el);
            const left = parseInt(style.left);
            const width = parseInt(style.width);
            return {
                left: left,
                width: width,
                right: left + width
            };
        });

        expect(selectionData.left).toBe(expectedSelections[i].left);
        expect(selectionData.width).toBe(expectedSelections[i].width);
        expect(selectionData.right).toBe(expectedSelections[i].right);
    }
});

