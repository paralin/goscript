package gs

import (
	"embed"
)

//
var GsOverrides embed.FS

func GetOverride(pkgPath, fileName string) (string, bool) {
	data, err := GsOverrides.ReadFile(pkgPath + "/" + fileName)
	if err != nil {
		return "", false
	}
	return string(data), true
}
