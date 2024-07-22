package habits

import (
	"bytes"
	_ "embed"
	"fmt"
	"html/template"
	"time"

	"zakirullin/stuffbot/internal"
	"zakirullin/stuffbot/internal/fs"
)

//go:embed templates/habits.html
var html string

func Render(userID int64, userFS *fs.FS) ([]byte, error) {
	tmpl, err := template.New("habits").Parse(html)
	if err != nil {
		return nil, fmt.Errorf("can't parse habits template: %w", err)
	}

	habits, err := LastWeekHabits(userFS)
	if err != nil {
		return nil, fmt.Errorf("can't render habit: %w", err)
	}

	moods, ok := habits[moodHabit]
	if ok {
		delete(habits, moodHabit)
	}

	var out bytes.Buffer
	err = tmpl.Execute(&out, map[string]any{
		"habits":     habits,
		"moods":      moods,
		"moodEmojis": moodEmojis,
		"host":       internal.Config.Host,
		"userID":     userID,
		"currentDay": time.Now().YearDay(),
	})
	if err != nil {
		return nil, fmt.Errorf("can't render habits template: %w", err)
	}

	return out.Bytes(), nil
}
