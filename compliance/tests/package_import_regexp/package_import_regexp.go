package main

import "regexp"

func main() {
    re, err := regexp.Compile("hello")
    if err != nil {
        println("Error compiling regexp:", err.Error())
        return
    }
    
    matched := re.MatchString("hello world")
    println("Match result:", matched)
    
    result := re.FindString("hello world")
    println("Find result:", result)
    
    println("Regexp package test completed")
}
