const path = require('path');
const url = require('url');
const fs = require("fs");
const {app, BrowserWindow, ipcMain, dialog, Notification} = require('electron');


let win;
let openedFilePath;


function createWindow() {
	win = new BrowserWindow({
		width: 1000,
		height: 800,
		webPreferences: {
			preload: path.join(app.getAppPath(), "render.js"),
		},
	});

	win.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true,
	}));

	win.webContents.openDevTools();

	win.on('closed', () => {
		win = null;
	});

};


app.on('ready', createWindow);

app.on('window-all-closed', () => {
	app.quit();
});


const handleError = () => {
	new Notification({
		title: "Ошибка",
		body: "Что-то пошло не так",
	}).show();
}

ipcMain.on("open-document", () => {
	dialog
		.showOpenDialog({
			properies: ["openFile"],
			filters: [{ name: "text files", extensions: ["txt"] }],
		})
		.then(({ filePaths}) => {
			const filePath = filePaths[0];

			fs.readFile(filePath, "utf8", (error, content) => {
				if(error){
					handleError();
				} else{
					openedFilePath = filePath;
					win.webContents.send("document-opened", { filePath, content });
				}
			})
		});
});

ipcMain.on("create-document", () => {
	dialog
		.showSaveDialog(win, {
			filters: [{ name: "text files", extensions: ["txt"] }]
		})
		.then(({ filePath }) => {
			fs.writeFile(filePath, "", (error) => {
				if(error){
					handleError();
				} else {
					openedFilePath = filePath;
					win.webContents.send("document-created", filePath);
				}
			})
		});
});


ipcMain.on("file-content-updated", (_, textareaContent) => {
	fs.writeFile(openedFilePath, textareaContent, (error) => {
		if(error){
			handleError();
		}
	});
});