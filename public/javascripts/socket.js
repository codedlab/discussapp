var socket = io();
let posts = [];
let userid;
let show = [];

const post = document.querySelector('#start');
const input = document.querySelector('.input-textbox');
const comment = document.querySelector('.comment-button');

socket.on("connect", () => {
  console.log(`${socket.id} connected`);
  userid = socket.id;
  console.log(`user`, userid);
});

socket.on("contact", (value) => {
  console.log(value);
  posts = value;
  if (posts.length !== 0) {
    post.innerHTML = "";
    display();
  }
});

comment?.addEventListener('click', function (e) {
  e.preventDefault();
  if (input.value === "") {
    console.log("nothing");
  }
  else {
    if (input.value) {
      socket.emit('event', { post: input.value, createdby: userid });
      input.value = '';
    }
  }
});

function display() {
  posts.sort((a, b) => b.createdtime.localeCompare(a.createdtime)).map((x) => {
    return (post.innerHTML += `
    ${x.reply.length > 0 ? `<ul class="comments-list">` : ""}
    <li id="${x.postidno}">
      <div class="comment-block">
        <img class="rounded-circle" src="./images/rob.png">
        <div class="comment-body">
          <a class="user-name">Rob Hope</a>
          <span class="dot"></span>
          <span class="post-time">${moment(x.createdtime).startOf().fromNow()}</span>
          <p class="comment">
          ${x.post}
          </p>
          <div class="social-interact">
            <span id="${x.postidno}-split-${x.createdby}" class="material-icons-sharp">
              arrow_drop_up
            </span>
            ${x.upvote.length > 0 ? `Upvoted(${x.upvote.length})` : "Upvote"}
              </span>
            <span id="replyid-split-${x.postidno}" class="reply"> Reply </span>
          </div>
        </div>
      </div>
      ${x.reply.length > 0 ? displayReply(x.reply, x.postidno) : ""}
    </li>
    ${x.reply.length > 0 ? `</ul>` : ""}
        <li id="replybox-split-${x.postidno}" class="d-none">
          <div class="comment-block">
            <img class="rounded-circle" src="./images/james.png">
            <div class="comment-body">
              <input type="text" id="input-textbox-reply-${x.postidno}" class="input-textbox-reply" placeholder="What are your reply?">
              <button id="comment-button-reply-split-${x.postidno}" class="comment-button-reply" type="button">Reply</button>
            </div>
          </div>
      </li>
  `);
  });
  window.scrollTo(0, document.body.scrollHeight);
}

function displayReply(reply, parent) {
  if (reply.length > 0) {
    post.innerHTML = "";
    reply.map((x) => {
      return (post.innerHTML += `
      <ul class="comments-list reply-list">
            <li id="${x.postReplyId}">
              <div class="comment-block">
                <img class="rounded-circle" src="./images/james.png">
                <div class="comment-body">
                  <a class="user-name">James</a>
                  <span class="dot"></span>
                  <span class="post-time">${moment(x.createdtime).startOf().fromNow()}</span>
                  <p class="comment">${x.content}
                  </p>
                  <div class="social-interact">
                    <span class="material-icons-sharp" id="${x.postReplyId}-split-${parent}">
                      arrow_drop_up
                    </span>${x.replyupvote.length > 0 ? `Upvoted(${x.replyupvote.length})` : "Upvote"}</span><span class="reply"> Reply </span>
                  </div>
                </div>
              </div>
            </li>
          </ul>
      `);
    });
    return post.innerHTML;
  }
}

socket.on('event', function (msg) {
  post.innerHTML = "";
  var size = Object.keys(msg).length;
  console.log(size);
  if (size <= 3) {
    console.log(msg);
    if (size === 2) {
      for (let result of posts) {
        if (result.postidno === msg.postid && userid !== msg.userid) {
          console.log(result);
          result.upvote.push(msg.userid);
        }
      }
    } else {
      for (let result of posts) {
        if (result.postidno === msg.postid && userid !== msg.userid) {
          console.log(result);
          for (let replyvote of result.reply) {
            if (replyvote.commentId === msg.commentId) {
              replyvote.replyupvote.push(msg.userid);
            }
          }
        }
      }
    }

  } else if (size === 6 && msg.hasOwnProperty('parentId')) {
    console.log(msg);
    for (let result of posts) {
      if (result.postidno === msg.parentId) {
        result.reply.push({ postReplyId: msg.commentId, content: msg.comment, createdtime: msg.createdtime, replyupvote: msg.replyupvote });
        let change = "#replybox" + "-split-" + msg.parentId;
        let addition = document.querySelector(change);
        addition?.classList.toggle('d-none');
      }
    }
  } else {
    posts.push(msg);
    show.push(false);
    console.log(posts);
  }
  display();
});


post?.addEventListener('click', function (e) {
  e.preventDefault();
  var itemId, splitItem, postItemId, userItemId;
  itemId = e.target.id;
  console.log(itemId);
  splitItem = itemId.split('-split-');
  postItemId = splitItem[0];
  userItemId = splitItem[1];
  if (postItemId === 'replyid') {
    let change = "#replybox" + "-split-" + userItemId;
    let addition = document.querySelector(change);
    addition.classList.toggle('d-none');
    return;
  } else if (postItemId === 'comment-button-reply') {
    let inputReply = document.querySelector(`#input-textbox-reply-${userItemId}`);
    if (inputReply.value === "") {
      console.log("nothing");
      return;
    }
    else {
      if (inputReply.value) {
        console.log(inputReply.value);
        socket.emit('event', { comment: inputReply.value, createdby: userid, parentId: userItemId });
        inputReply.value = '';
        let change = "#replybox" + "-split-" + userItemId;
        let addition = document.querySelector(change);
        addition.classList.toggle('d-none');
        return;
      }
    }
  }
  console.log(show);
  for (let result of posts) {
    if (postItemId.length > 4 && result.postidno === postItemId && (result.upvote.indexOf(userid) === -1)) {
      console.log(result.upvote.indexOf(userid));
      result.upvote.push(userid);
      socket.emit('event', { postid: result.postidno, userid });
    }
    if (postItemId.length === 4 && result.postidno === userItemId) {
      console.log('drip');
      for (let voting of result.reply) {
        if (voting.postReplyId === postItemId && voting.replyupvote.indexOf(userid) === -1) {
          voting.replyupvote.push(userid);
          console.log('voting', voting, posts);
          socket.emit('event', { postid: result.postidno, userid, postReplyId: voting.postReplyId });
        }
      }
    }
  }
});
