var crypto = require('crypto'),
    User = require('../models/user.js');
    Post = require('../models/post.js');
    Comment = require('../models/comment');
    upload = require('./multer');
;
function checkLogin(req,res,next) {
    if (!req.session.user){
        req.flash('error','请登录');
    }
    next();
}
function checkNotLogin(req,res,next) {
    if (req.session.user){
        req.flash('error','已登录');
        return res.redirect('/');
    }
    next();
}
module.exports = function(app) {
      //主页
    app.get('/', function (req, res) {
        //判断是否是第一页，并把请求的页数转换成number类型
        var  page = req.query.p ? parseInt(req.query.p) : 1;
        //查询并返回第page页的10篇文章
      Post.getTen(null,page, function (err, posts,total) {
          if (err){
              posts = [];
          }
          res.render('index',{
              title:'主页',
              user:req.session.user,
              posts:posts,
              page: page,
              isFirstPage: (page - 1) == 0,
              isLastPage: ((page - 1) * 10 + posts.length) == total,
              success:req.flash('success').toString(),
              error:req.flash('error').toString()
          });
      });
  });
     //注册
    app.get('/reg',checkNotLogin);
    app.get('/reg', function(req,res){
        res.render('reg',{
            title: '注册',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/reg',checkNotLogin);
    app.post('/reg', function(req,res){
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('base64');
        var    newUser = new User({
            name: req.body.username,
            password: password
        });
        //判断两次输入的密码是否一致
        if (req.body['password-repeat'] != req.body['password']){
            req.flash('error','两次输入的密码不一致');
            return res.redirect('/reg');
        }
        //检查用户是否已经存在
        User.get(newUser.name, function(err, user){
            if(err){
                req.flash('error', err);
                return res.redirect('/reg');
            }
             if(user){
                 req.flash('error','用户已存在');
                 return res.redirect('/reg');
             }
            //如果不存在则新增用户
            newUser.save(function(err){
                if(err){
                    req.flash('error','注册失败');
                    return res.redirect('/reg');
                }
                req.session.user = newUser;
                req.flash('success','注册成功');
                res.redirect('/');
            });
        });
    });
    //登录
    app.get('/login',checkNotLogin);
    app.get('/login', function(req, res){
        res.render('login',{
            title:'登录',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });
    app.post('/login',checkNotLogin);
    app.post('/login', function(req, res){
        var md5 = crypto.createHash('md5'),
            password = md5.update(req.body.password).digest('base64');
        User.get(req.body.username, function(err, user){
            if(!user){
                req.flash('error', '用户不存在');
                return res.redirect('/login');
            }
            if(user.password != password){
                req.flash('error', '密码错误');
                return res.redirect('/login');
            }
            req.session.user = user;
            req.flash('success','登陆成功');
            res.redirect('/');
        });
    });
    //退出
    app.get('/logout',checkLogin);
    app.get('/logout', function(req, res) {
        req.session.user = null;
        req.flash('success', '登出成功');
        res.redirect('/');
    });
    //上传文件
    app.get('/upload', function (req, res) {
        res.render('upload', {
            title: '文件上传',
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/upload',upload.single('photo'), function (req, res) {
        req.flash('success', '文件上传成功!');
        res.redirect('/');
    });
    //关于
    app.get('/about', function(req, res){
        res.render('about',{
            title:'关于',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });
    //搜索
    app.get('/search', function (req, res) {
        Post.search(req.query.keyword, function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('search', {
                title: "文章检索" + req.query.keyword,
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
   //发表
    app.get('/post', function(req, res){
        res.render('post',{
            title:'发表',
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        });
    });
    app.post('/post', function(req, res){
        var currentUser = req.session.user,
            tags = [req.body.tag1, req.body.tag2, req.body.tag3],
            post = new Post(currentUser.name, req.body.title,tags,req.body.post);
            post.save(function(err){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功!');
            res.redirect('/');
        });
    });
    //进入文章页
    app.get('/:user/:time/:title',function (req,res) {
        User.get(req.params.user,function (err,user) {
            Post.getOne(req.params.user,req.params.time,req.params.title,function (err,post) {
                if (err){
                    req.flash('err',err);
                    return res.redirect('/');
                }
                res.render('article',{
                    title:req.params.title,
                    post:post,
                    user:req.session.user,
                    success:req.flash('success').toString(),
                    error:req.flash('error').toString()
                });
            });
        });
    });
    app.post('/:user/:time/:title',function (req,res) {
        var comment = null,
            date = new Date(),
            time = date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + "-"+date.getHours() + ":" + date.getMinutes();
        if (req.session.user){
            var name=req.session.user.name;
            comment = {"name":name,"email":name+"@email.com","website":"www"+name+".com","time":time,"content":req.body.content}
        }else {
            comment = {"name":req.body.name,"email":req.body.email,"website":req.body.website,"time":time,"connect":req.body.content}
        }
        var oneComment = new Comment(req.params.user,req.params.time,req.params.title,comment);
        oneComment.save(function (err) {
            if (err){
                req.flash('error',err);
                return res.redirect('/');
            }
            req.flash('success','评论成功');
            res.redirect('back');//评论成功后返回被评论文章
        });
    });
    //进入作者页
    app.get('/:user',function (req,res){
        var page = req.query.p ? parseInt(req.query.p):1;
        //检查用户是否存在
       User.get(req.params.user,function (err,user) {
           if (!user){
               return res.redirect('/');
           }
           //查询并返回该用户的第page页的10篇文章
           Post.getTen(req.params.user,page,function (err,posts,total) {
               if (err){
                   req.flash('err',err);
                   return res.redirect('/');
               }
               res.render('user',{
                   title:req.params.user,
                   posts:posts,
                   user:req.session.user,
                   page:page,
                   isFirstPage:(page -1) == 0,
                   isLastPage:((page - 1)*10 + posts.length) == total,
                   success:req.flash('success').toString(),
                   error:req.flash('error').toString()
               });
           });
       });
    });
    //编辑文章
    app.get('/edit/:user/:time/:title', checkLogin);
    app.get('/edit/:user/:time/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.edit(currentUser.name, req.params.time, req.params.title, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            res.render('edit', {
                title: '编辑',
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });
    app.post('/edit/:user/:time/:title', checkLogin);
    app.post('/edit/:user/:time/:title',function(req,res){
        var currentUser= req.session.user;
        Post.update(currentUser.name,req.params.time,req.params.title,req.body.post,function(err){
           // var url=encodeURL('/'+req.params.user+'/'+req.params.time+'/'+req.params.title);
            if(err){
                console.log(err);
                return res.redirect('/');//出错返回主页
            }
           console.log("成功");
            res.redirect('/');//成功！返回主页
        });
    });
    //删除文章
    app.get('/remove/:user/:time/:title', checkLogin);
    app.get('/remove/:user/:time/:title', function (req, res) {
        var currentUser = req.session.user;
        Post.remove(currentUser.name, req.params.time, req.params.title, function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            req.flash('success', '删除成功!');
            res.redirect('/');
        });
    });
    //404
    app.use(function (req, res) {
        res.render("404");
    })

};
