var multer = require('multer');
var storage = multer.diskStorage({
    //定义上传后文件保存路径
    destination: './public/images',
    //给上传文件重命名
    filename:function (req,file,callback) {
        callback(null,file.originalname);
    }
});
var upload = multer({
    storage:storage
});
module.exports = upload;