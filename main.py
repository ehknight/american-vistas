from flask import Flask, render_template, request, send_from_directory
import flask

app = Flask(__name__)

@app.route('/')
def mainroute():
    img_path = open("cur_ref_img_path.txt").readlines()[0]
    people = open("people.txt").readlines()
    print(people)
    return render_template('american-vistas.html', people=people, img_path=img_path)

@app.route('/<path:filename>')  
def send_file(filename):  
    return send_from_directory('static', filename)

@app.route('/ref_images/<path:filename>')  
def send_ref_images(filename):  
    return send_from_directory('ref_images', filename)

app.run(host='0.0.0.0', port=80)
