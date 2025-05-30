package main

type storage struct {
	files    map[string]*file
	children map[string]map[string]*file
}
