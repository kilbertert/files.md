package config

import (
	"fmt"

	"github.com/kelseyhightower/envconfig"
)

type BotConfig struct {
	StoragePath    string `required:"true" envconfig:"STORAGE_PATH"`
	BotAPIToken    string `required:"true" envconfig:"BOT_API_TOKEN"`
	ConfigFilename string `default:"config.json"`
	HabitsHost     string `default:"" envconfig:"HABITS_HOST"`
	ServerCertPath string `default:"/tmp" envconfig:"SERVER_CERT_PATH"`
	ServerLogsPath string `default:"/tmp" envconfig:"SERVER_LOGS_PATH"`
}

var BotCfg BotConfig

func LoadBotConfig() error {
	if err := envconfig.Process("", &BotCfg); err != nil {
		return fmt.Errorf("can't load config: %w", err)
	}

	return nil
}
