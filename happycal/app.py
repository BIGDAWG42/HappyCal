from flask import Flask, send_from_directory

app = Flask(__name__, static_folder='happyCal/build', static_url_path='')

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0')
