package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/binod-labs/utm/pkg/log"
	"github.com/spf13/cobra"
)

var serviceName = "utm"

var (
	Version = "N/A"
	Commit  = "N/A"
	BuiltOn = "N/A"

	rootCmd = &cobra.Command{
		Use:               "utm",
		Short:             "UTM links service",
		Version:           fmt.Sprintf("%s\ncommit: %s\nbuild date: %s", Version, Commit, BuiltOn),
		CompletionOptions: cobra.CompletionOptions{DisableDefaultCmd: true},
	}
)

func main() {
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	var logLevel, logMode string
	flags := rootCmd.PersistentFlags()
	flags.StringVarP(&logLevel, "log-level", "l", "info", "log level")
	flags.StringVarP(&logMode, "log-mode", "m", "dev", "log mode (off, dev, prod)")

	flags.StringP("config", "c", "", "override configuration file")

	var cleanupLogger = func() {}
	rootCmd.PersistentPreRunE = func(cmd *cobra.Command, args []string) error {
		cleanup, err := log.Setup(logMode, logLevel)
		if err != nil {
			return err
		}
		cleanupLogger = cleanup
		return nil
	}

	rootCmd.PersistentPostRunE = func(cmd *cobra.Command, args []string) error {
		cleanupLogger()
		return nil
	}

	rootCmd.AddCommand(cmdConfigs(), cmdServer(), cmdMigrate())

	rootCmd.SilenceUsage = true
	rootCmd.SilenceErrors = true

	if err := rootCmd.ExecuteContext(ctx); err != nil {
		log.Fatal(ctx, "command failed", log.Err(err))
		os.Exit(1)
	}
}
