package config

import (
	"fmt"
	"reflect"
	"strings"

	"github.com/mcuadros/go-defaults"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

const (
	flagName    = "config"
	flagSecrets = "secrets"
)

type viperLoader struct {
	viper         *viper.Viper
	intoPtr       interface{}
	confFile      string
	confName      string
	useEnv        bool
	useDefaults   bool
	secretObjKeys []string
}

func Load(cmd *cobra.Command, configName string, structPtr interface{}) error {
	l := &viperLoader{
		viper:       viper.New(),
		intoPtr:     structPtr,
		useEnv:      true,
		useDefaults: true,
		confName:    configName,
	}

	if cmd != nil {
		if cfgFlag := cmd.Flags().Lookup(flagName); cfgFlag != nil {
			cfgFile, err := cmd.Flags().GetString(flagName)
			if err != nil {
				return err
			}
			l.confFile = cfgFile
		}

		if secretsFlag := cmd.Flags().Lookup(flagSecrets); secretsFlag != nil {
			secrets, err := cmd.Flags().GetStringSlice(flagSecrets)
			if err != nil {
				return err
			}
			l.secretObjKeys = secrets
		}
	}

	if err := l.load(); err != nil {
		return err
	}
	return nil
}

func (l *viperLoader) load() error {
	v := l.viper

	keys, err := extractConfigDefs(l.intoPtr, l.useDefaults)
	if err != nil {
		return err
	}

	for _, cfg := range keys {
		v.SetDefault(cfg.Key, cfg.Default)
	}

	if l.useEnv {
		// for transforming app.host to app_host
		v.SetEnvKeyReplacer(strings.NewReplacer(".", "_", "-", "_"))
		v.SetEnvPrefix("")
		v.AutomaticEnv()
		for _, cfg := range keys {
			if err := v.BindEnv(cfg.Key); err != nil {
				return err
			}
		}
	}

	if l.confFile != "" {
		v.SetConfigFile(l.confFile)
		if err := v.ReadInConfig(); err != nil {
			return err
		}
	} else {
		if l.confName == "" {
			l.confName = "config"
		}
		v.AddConfigPath("./")
		v.AddConfigPath("./resources")
		v.AddConfigPath("./configs")
		v.SetConfigName(l.confName)
		_ = v.ReadInConfig()
	}

	return v.Unmarshal(l.intoPtr)
}

type configDef struct {
	Key     string      `json:"key"`
	Doc     string      `json:"doc"`
	Default interface{} `json:"default"`
}

func extractConfigDefs(structPtr interface{}, useDefaults bool) ([]configDef, error) {
	rv := reflect.ValueOf(structPtr)

	if err := ensureStructPtr(rv); err != nil {
		return nil, err
	}

	if useDefaults {
		defaults.SetDefaults(structPtr)
	}

	return readRecursive(deref(rv), "")
}

func readRecursive(rv reflect.Value, rootKey string) ([]configDef, error) {
	rt := rv.Type()

	var acc []configDef
	for i := 0; i < rv.NumField(); i++ {
		ft := rt.Field(i)
		fv := deref(rv.Field(i))

		key := extractFieldKey(ft, rootKey)

		if fv.Kind() == reflect.Struct {
			nestedConfigs, err := readRecursive(fv, key)
			if err != nil {
				return nil, err
			}
			acc = append(acc, nestedConfigs...)
		} else {
			acc = append(acc, configDef{
				Key:     key,
				Doc:     ft.Tag.Get("doc"),
				Default: fv.Interface(),
			})
		}
	}

	return acc, nil
}

func extractFieldKey(ft reflect.StructField, rootKey string) string {
	key := ft.Tag.Get("mapstructure")
	if key == "" {
		key = toCamelCase(ft.Name)
	}
	if rootKey != "" {
		key = fmt.Sprintf("%s.%s", rootKey, key)
	}
	return key
}

func toCamelCase(s string) string {
	var result string
	for i, r := range s {
		if i > 0 && (r >= 'A' && r < 'Z') {
			result += "_"
		}
		result += strings.ToLower(string(r))
	}
	return result
}

func deref(rv reflect.Value) reflect.Value {
	if rv.Kind() == reflect.Ptr {
		rv = reflect.Indirect(rv)
	}
	return rv
}

func ensureStructPtr(value reflect.Value) error {
	if value.Kind() != reflect.Ptr {
		return fmt.Errorf("need a pointer to struct, not '%s'", value.Kind())
	} else {
		value = reflect.Indirect(value)
		if value.Kind() != reflect.Struct {
			return fmt.Errorf("need a pointer to struct, not pointer to '%s'", value.Kind())
		}
	}
	return nil
}
