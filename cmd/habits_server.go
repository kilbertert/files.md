package main

import (
	"net/http"
	"strconv"
	"path"
	"time"

	"github.com/spf13/afero"

	"zakirullin/stuffbot/internal"
	"zakirullin/stuffbot/internal/fs"
	"zakirullin/stuffbot/internal/habits"
	"zakirullin/stuffbot/pkg/txt"
)

// TODO graceful shutdown etc
func habitsServer() {
	router := http.NewServeMux()
	// TODO add hashing or secrets
	router.HandleFunc("GET /{userID}/habits", func(w http.ResponseWriter, r *http.Request) {
		userID, err := strconv.ParseInt(r.PathValue("userID"), 10, 64)
		if err != nil {
			w.Write([]byte("can't parse userID"))
		}

		userPath := path.Join(internal.Config.StoragePath, txt.I64(userID))
		userFS, err := fs.NewFS(userPath, afero.NewOsFs())
		if err != nil {
			w.Write([]byte("can't init userFS"))
		}

		str, err := habits.Render(userID, userFS)
		if err != nil {
			w.Write([]byte(err.Error()))
		}
		w.Write(str)
	})

	router.HandleFunc("POST /{userID}/habits/{habitName}/{yearDay}/{status}", func(w http.ResponseWriter, r *http.Request) {
		userID, err := strconv.ParseInt(r.PathValue("userID"), 10, 64)
		if err != nil {
			w.Write([]byte("can't parse userID"))
		}

		yearDay, err := strconv.ParseInt(r.PathValue("yearDay"), 10, 32)
		if err != nil {
			w.Write([]byte("can't parse yearDay"))
		}

		status, err := strconv.ParseInt(r.PathValue("status"), 10, 32)
		if err != nil {
			w.Write([]byte("can't parse status"))
		}


		habitName := r.PathValue("habitName")

		userPath := path.Join(internal.Config.StoragePath, txt.I64(userID))
		userFS, err := fs.NewFS(userPath, afero.NewOsFs())
		if err != nil {
			w.Write([]byte("can't init user fs"))
		}

		userHabits, err := habits.Habits(userFS, time.Now().Year())
		if err != nil {
			w.Write([]byte("can't read habits"))
		}

		userHabits[habitName][int(yearDay)] = int(status)
		err = habits.Write(userFS, time.Now().Year(), userHabits)
		if err != nil {
			w.Write([]byte("can't write habits"))
		}
	})

	http.ListenAndServe(":80", router)
}
