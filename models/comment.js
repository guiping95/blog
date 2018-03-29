var mongodb = require('./db');

function Comment(user, day, title, comment) {
    this.user = user;
    this.day = day;
    this.title = title;
    this.comment = comment;
}

module.exports = Comment;

Comment.prototype.save = function(callback) {
    var user = this.user,
        day = this.day,
        title = this.title,
        comment = this.comment;
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }

        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //通过用户名、时间及标题查找文档，并把一条留言对象添加到该文档的comments数组里
            collection.update({
                "user" : user,
                "time.day": day,
                "title" :title
            },{
                $push:{"comments":comment}
            },function (err) {
                mongodb.close();
                if (err){
                    return callback(err);
                }
                callback(null);
            });
            // collection.findAndModify({"user":user,"time.day":day,"title":title}
            //     , [['time',-1]]
            //     , {$push:{"comments":comment}}
            //     , {new: true}
            //     , function (err,comment) {
            //         mongodb.close();
            //         callback(err,comment);
            //     });
        });
    });
};