package compiler

import (
	"testing"
)

func TestConfigValidate(t *testing.T) {
	tests := []struct {
		name    string
		config  *Config
		wantErr bool
		errMsg  string
	}{
		{
			name: "valid config",
			config: &Config{
				Dir:        "/some/dir",
				OutputPath: "/output/path",
				BuildFlags: []string{"-tags", "sometag"},
			},
			wantErr: false,
		},
		{
			name: "empty output path root",
			config: &Config{
				Dir:        "/some/dir",
				BuildFlags: []string{"-tags", "sometag"},
			},
			wantErr: true,
			errMsg:  "output path root must be specified",
		},
		{
			name: "nil fset gets initialized",
			config: &Config{
				fset:       nil,
				Dir:        "/some/dir",
				OutputPath: "/output/path",
			},
			wantErr: false,
		},
		// Note: There's a potential issue in the Validate method where it checks if c == nil
		// after already using c to set fset, which could cause a panic
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.config.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Config.Validate() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if err != nil && tt.errMsg != "" && err.Error() != tt.errMsg {
				t.Errorf("Config.Validate() error message = %v, want %v", err.Error(), tt.errMsg)
			}

			if tt.name == "nil fset gets initialized" && tt.config.fset == nil {
				t.Errorf("Config.Validate() did not initialize nil fset")
			}
		})
	}
}
