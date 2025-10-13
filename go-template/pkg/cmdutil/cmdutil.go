package cmdutil

import (
	"encoding/json"
	"fmt"
	"os"
	"slices"
	"strings"

	"github.com/BurntSushi/toml"
	"github.com/binod-labs/utm/pkg/config"
	"github.com/binod-labs/utm/pkg/log"
	"github.com/mitchellh/mapstructure"
	"github.com/spf13/cobra"
	"gopkg.in/yaml.v2"
)

// ConfigT must be implemented by config types.
type ConfigT interface {
	Monitoring() (logLevel, logMode string)
}

// BaseConf is base configuration for all commands.
type BaseConf struct {
	LogLevel string `mapstructure:"log_level"`
	LogMode  string `mapstructure:"log_mode"`
}

// RunE is an extension to the cobra RunE function.
type RunE[T ConfigT] func(cmd *cobra.Command, args []string, cfg T) error

// Wrap wraps the cobra command with config loader functionality.
// The command must not have the following flags:
//   - `--configs`
//   - `--secrets`
func Wrap[T ConfigT](cmd *cobra.Command, cfgName string, run RunE[T]) *cobra.Command {
	flags := cmd.PersistentFlags()
	flags.StringP("config", "c", "", "Config path override (disables discovery)")
	flags.StringSlice("secrets", nil, "AWS secret manager keys to use as source (must point to key-value maps)")

	// Add a helper command to print the loaded config.
	cmd.AddCommand(cmdShowConfig[T](cfgName, cmd))

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		var cfg T
		if err := config.Load(cmd, cfgName, &cfg); err != nil {
			return fmt.Errorf("load config: %w", err)
		}

		logLevel, logMode := cfg.Monitoring()

		flushLogger, err := log.Setup(logMode, logLevel)
		if err != nil {
			return fmt.Errorf("setup logger: %w", err)
		}
		defer flushLogger()

		return run(cmd, args, cfg)
	}

	return cmd
}

func cmdShowConfig[T ConfigT](cfgName string, parent *cobra.Command) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "configs",
		Short: "Print the loaded config and exit",
	}

	var format string
	cmd.Flags().StringVarP(&format, "format", "f", "json", "Print configs in this format and exit (json, yaml, toml, env)")

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		var cfg T
		if err := config.Load(cmd, cfgName, &cfg); err != nil {
			return fmt.Errorf("load config: %w", err)
		}

		return printConfig(cfg, format)
	}

	return cmd
}

func printConfig(cfg any, format string) error {
	m := map[string]any{}
	if err := mapstructure.Decode(cfg, &m); err != nil {
		return fmt.Errorf("decode configs: %v", err)
	}

	switch format {
	case "json":
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		return enc.Encode(m)

	case "toml":
		enc := toml.NewEncoder(os.Stdout)
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

func (bc BaseConf) Monitoring() (logMode, logLevel string) {
	return bc.LogMode, bc.LogLevel
}
