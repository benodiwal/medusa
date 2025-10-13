package main

import (
	"context"
	"fmt"

	"github.com/binod-labs/utm/internal/server"
	"github.com/spf13/cobra"
)

func cmdServer() *cobra.Command {
	cmd := &cobra.Command{
		Use:     "serve",
		Short:   "Starts the UTM server",
		Aliases: []string{"server", "start", "run"},
	}

	cmd.RunE = func(cmd *cobra.Command, args []string) error {
		ctx, cancel := context.WithCancel(cmd.Context())
		defer cancel()

		cfg, err := loadConfigs(cmd)
		if err != nil {
			return fmt.Errorf("load configs: %w", err)
		}

		opts := server.Options{
			HTTPAddr:     cfg.HTTPAddr,
			ReadTimeout:  cfg.HTTPReadTimeout,
			WriteTimeout: cfg.HTTPWriteTimeout,
		}

		if err := server.Serve(ctx, opts); err != nil {
			return fmt.Errorf("server: %w", err)
		}

		return nil
	}

	return cmd
}
