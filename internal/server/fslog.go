package server

import (
	"fmt"
	"net/url"
	"os"
	"path"
	"sync"

	"zakirullin/stuffbot/config"
)

var lock sync.RWMutex

func LogRename(time int64, oldPath, newPath string) {
	lock.Lock()
	defer lock.Unlock()

	file, err := os.OpenFile(path.Join(config.BotCfg.WorkingDir, "fslog"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer file.Close()

	oldPath = url.QueryEscape(oldPath)
	newPath = url.QueryEscape(newPath)
	record := fmt.Sprintf("%d %s %s\n", time, oldPath, newPath)

	file.WriteString(record)
	file.Sync()
}
