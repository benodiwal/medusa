package main

import (
	"fmt"

	"github.com/binod-labs/utm/internal/pgsql"
	"github.com/binod-labs/utm/pkg/cmdutil"
	"github.com/spf13/cobra"
)

func cmdMigrate() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "migrate",
		Short: "Perform database migrations",
	}
	return cmdutil.Wrap(cmd, "utm", func(cmd *cobra.Command, args []string, cfg appConfig) error {
		fmt.Printf("Running migration against: '%s'\n", cfg.PGConnStr)
		if err := pgsql.Migrate(cfg.PGConnStr); err != nil {
			return fmt.Errorf("migrate: %w", err)
		}
		fmt.Println("✅  Migration applied successfully.")
		return nil
	})
}
