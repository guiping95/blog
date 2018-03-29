var mongodb = require('./db');
    markdown = require('markdown').markdown;
function Post(user,title,tags,post) {
    this.user = user ;
    this.title = title;
    this.tags = tags;
    this.post = post;
}

module.exports = Post;

Post.prototype.save = function(callback) {
    var date = new Date();
    var time = {
        date: date,
        year : date.getFullYear(),
        month : date.getFullYear() + "-" + (date.getMonth()+1),
        day : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate(),
        minute : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes()
    }
    var post = {
        user: this.user,//用户
        time: time,//发表时间
        title: this.title,//标题
        tags:this.tags,//标签
        pv:0,//访问量
        post: this.post,//文章内容
        comments:[]//评论
    };

    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //将文档出入posts集合里
            collection.insert(post, {
                safe: true
            }, function (err,post) {
                mongodb.close();
                callback(err,post);
            });
        });
    });
};
//读取文章及其相关信息
// Post.getAll = function(user, callback) {//获取一个人的所有文章
//     mongodb.open(function (err, db) {
//         if (err) {
//             return callback(err);
//         }
//
//         db.collection('posts', function(err, collection) {
//             if (err) {
//                 mongodb.close();
//                 return callback(err);
//             }
//
//             var query={};
//             if(user){//因为index.js中app.get('/')为Post.getAll(null, function(err, posts){}),所以要判断user
//                 query.user=user;
//             }
//             collection.find(query).sort({
//                 time: -1
//             }).toArray(function (err, docs) {
//                 mongodb.close();
//                 if (err) {
//                     callback(err,null);
//                 }
//                 //解析 markdown 为 html
//                 docs.forEach(function (doc) {
//                     if (doc.post){
//                         doc.post = markdown.toHTML(doc.post);
//                     }
//                 });
//                 callback(null,docs);
//             });
//         });
//     });
// };
// //分页
// Post.getTen = function(user, page, callback) {//获取十篇文章
//     mongodb.open(function (err, db) {
//         if (err) {
//             return callback(err);
//         }
//         //读取posts集合
//         db.collection('posts', function(err, collection) {
//             if (err) {
//                 mongodb.close();
//                 return callback(err);
//             }
//
//             var query = {};
//             if(user){
//                 query.user = user;
//             }
//             collection.find(query,{skip:(page-1)*5, limit:5}).sort({
//                 time: -1
//             }).toArray(function (err, docs) {
//                 mongodb.close();
//                 if (err) {
//                     callback(err,null);
//                 }
//                 callback(null,docs);
//             });
//         });
//     });
// };
//获取一篇文章
//一次获取十篇文章
//分页实现一页十篇文章
Post.getTen = function(user, page, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (user) {
                query.user = user;
            }
            //使用 count 返回特定查询的文档数 total
            collection.count(query, function (err, total) {
                //根据 query 对象查询，并跳过前 (page-1)*10 个结果，返回之后的 10 个结果
                collection.find(query, {
                    skip: (page - 1)*10,
                    limit: 10
                }).sort({
                    time: -1
                }).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    //解析 markdown 为 html
                docs.forEach(function (doc) {
                    if (doc.post){
                        doc.post = markdown.toHTML(doc.post);
                    }
                });
                    callback(null, docs, total);
                });
            });
        });
    });
};
//获取一篇文章
Post.getOne = function(user, day, title, callback) {//获取一篇文章
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取posts集合
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }

            collection.findOne({"user":user,"time.day":day,"title":title},function (err, doc) {
                mongodb.close();
                if (err) {
                    callback(err,null);
                }
                //解析 markdown 为 html
                if (doc) {
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function (comment) {
                        comment.content = markdown.toHTML(comment.content);
                    });
                }
                callback(null, doc);//返回查询的一篇文章
            });
            collection.update({"user":user,"time.day":day,"title":title},{$inc:{"pv":1}});
        });
    });
};
//编辑文章
Post.edit = function(user, day, title, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //根据用户名、发表日期及文章名进行查询
            collection.findOne({"user": user, "time.day": day, "title": title}, function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, doc);//返回查询的一篇文章（markdown 格式）
            });
        });
    });
};
//更新一篇文章及其相关信息
Post.update = function(user, day, title, post, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //更新文章内容
            collection.update({
                "user": user,
                "time.day": day,
                "title": title
            }, {
                $set: {post: post}
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};
//删除一篇文章
Post.remove = function(user, day, title, callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //根据用户名、日期和标题查找并删除一篇文章
            collection.remove({"user": user, "time.day": day, "title": title
            }, {
                w: 1
            }, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        });
    });
};
//返回所有文章存档信息
Post.getArchive = function(callback) {
    //打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        //读取 posts 集合
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            //返回只包含 user、time、title 属性的文档组成的存档数组
            collection.find({}, {
                "user": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};
//返回通过标题关键字查询的所有文章信息
Post.search = function(keyword, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp(keyword, "i");
            collection.find({
                "title": pattern
            }, {
                "user": 1,
                "time": 1,
                "title": 1
            }).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            });
        });
    });
};
