from flask import Flask, render_template, request, send_from_directory
import flask

app = Flask(__name__)

@app.route('/')
def mainroute():
    people = open("people.txt").readlines()
    print people
    return render_template('american-vistas.html', people=people)

@app.route('/<path:filename>')  
def send_file(filename):  
    return send_from_directory('static', filename)

app.run(port=5000)