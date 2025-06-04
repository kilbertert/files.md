package server

import (
	"fmt"
	"net/url"
	"os"
	"path"
	"sync"
	"time"

	"zakirullin/stuffbot/config"
)

var lock sync.RWMutex

type LogEntry struct {
	Timestamp int64
	OldPath   string
	NewPath   string
}

func LogRename(oldPath, newPath string) {
	entry := LogEntry{
		Timestamp: time.Now().Unix(),
		OldPath:   oldPath,
		NewPath:   newPath,
	}

	lock.Lock()
	defer lock.Unlock()

	file, err := os.OpenFile(path.Join(config.BotCfg.WorkingDir, "fslog"), os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer file.Close()

	oldPath = url.QueryEscape(entry.OldPath)
	newPath = url.QueryEscape(entry.NewPath)
	record := fmt.Sprintf("%d %s %s\n", entry.Timestamp, oldPath, newPath)

	file.WriteString(record)
	file.Sync()
}
