package main

import (
	"encoding/json"
	"fmt"
	"os"
	"slices"
	"strings"
	"time"

	"github.com/binod-labs/utm/pkg/config"
	"github.com/mitchellh/mapstructure"
	"github.com/spf13/cobra"
	"gopkg.in/yaml.v2"
)

type appConfig struct {
	HTTPAddr         string        `mapstructure:"http_addr" default:":8090"`
	HTTPReadTimeout  time.Duration `mapstructure:"http_read_timeout" default:"5s"`
	HTTPWriteTimeout time.Duration `mapstructure:"http_write_timeout" default:"10s"`
	PGConnStr        string        `mapstructure:"pg_conn_str"`

	HTTPClient httpClientConf `mapstructure:"http_client"`
}

type httpClientConf struct {
	MaxIdleConns    int           `mapstructure:"max_idle_conns" default:"100"`
	MaxIdlePerHost  int           `mapstructure:"max_idle_per_host" default:"10"`
	IdleConnTimeout time.Duration `mapstructure:"idle_conn_timeout" default:"90s"`
}

func (cfg appConfig) Monitoring() (logMode, logLevel string) {
	return "", ""
}

func cmdConfigs() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "configs",
		Short: "Show currently loaded configuration",
	}

	var format string
	cmd.Flags().StringVarP(&format, "format", "f", "json", "Output format (json, yaml)")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		cfg, err := loadConfigs(cmd)
		if err != nil {
			return err
		}

		m := map[string]any{}
		if err := mapstructure.Decode(cfg, &m); err != nil {
			return fmt.Errorf("decode configs: %v", err)
		}

		switch format {
		case "json":
			enc := json.NewEncoder(os.Stdout)
			enc.SetIndent("", "  ")
			return enc.Encode(m)

		case "yaml", "yml":
			enc := yaml.NewEncoder(os.Stdout)
			return enc.Encode(m)

		case "env":
			envD := nestedEnv("", m)
			var keyVals []string
			for k, v := range envD {
				keyVals = append(keyVals, fmt.Sprintf("%s=\"%v\"", strings.ToUpper(k), v))
			}
			slices.Sort(keyVals)

			fmt.Println(strings.Join(keyVals, "\n"))
			return nil

		default:
			return fmt.Errorf("unsupported format: %s", format)
		}
	}

	return cmd
}

func loadConfigs(cmd *cobra.Command) (appConfig, error) {
	var cfg appConfig
	if err := config.Load(cmd, serviceName, &cfg); err != nil {
		return cfg, err
	}

	return cfg, nil
}

func nestedEnv(prefix string, m map[string]any) map[string]any {
	env := map[string]any{}
	for k, v := range m {
		newPrefix := k
		if prefix != "" {
			newPrefix = prefix + "_" + k
		}

		switch v := v.(type) {
		case map[string]any:
			for kk, vv := range nestedEnv(newPrefix, v) {
				env[kk] = vv
			}
		default:
			env[newPrefix] = v
		}
	}
	return env
}
