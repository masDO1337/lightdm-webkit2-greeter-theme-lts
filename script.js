// called when the greeter asks to show a message
function show_message(text) {
  let message = document.querySelector("#message_content");
  message.innerText = text;
  if (text) {
    document.querySelector("#message").classList.remove("mhidden");
    setTimeout(function(){ show_message(""); }, 2500);
  } else {
    document.querySelector("#message").classList.add("mhidden");
  }
  document.querySelector("#message").classList.remove("error");
}

// called when the greeter asks to show an error
function show_error(text) {
  show_message(text);
  document.querySelector("#message").classList.add("error");
}

// called when the greeter asks to show a login prompt for a user
function show_prompt(text) {
  let password_container = document.querySelector("#password");
  let password_entry = document.querySelector("#password_entry");
  if (password_container.style.display === "none") {
    document.querySelector("#users").style.display = "none";

    for (var user of lightdm.users) {
      if(user.name == lightdm.authentication_user){
        password_container.querySelector(".user_name").innerText = user.display_name;
        document.querySelector("#sessions").value = user.session;
        break;
      }
    }

    password_container.style.display = "";
  }
  password_entry.value= "";
  password_entry.focus();
}

// called when the greeter is finished the authentication request
function authentication_complete() {
  let container = document.querySelector("#sessions");
  if (lightdm.is_authenticated) {
    show_message("Authenticated")
    document.body.style.opacity = 0;
    setTimeout(function(){
      if (container.value === lightdm.default_session.key) {
        lightdm.login(lightdm.authentication_user, lightdm.default_session);
      } else {
        lightdm.login(lightdm.authentication_user, container.value);
      }
    }, 1000);
  } else {
    show_error("Authentication Failed");
    start_authentication(lightdm.authentication_user);
  }
}

// called when the greeter wants us to perform a timed login
function timed_login(user) {
  lightdm.login(lightdm.timed_login_user);
}

let clicked = false;

function user_clicked(event) {
  if (clicked !== false) {
    clicked = false;
    lightdm.cancel_authentication();
    document.querySelector("#users").style.display = "";
    document.querySelector("#password").style.display = "none";
    show_error("Canceled");
  } else {
    clicked = true;
    show_message("Authenticating");
    start_authentication(event.currentTarget.id);
  }
}

function start_authentication(username) {
  lightdm.cancel_timed_login();
	lightdm.start_authentication(username);
}

function provide_secret() {
  show_message("Logging in...");
  entry = document.querySelector('#password_entry');
  lightdm.respond(entry.value);
}

function initialize_users() {
  let template = document.querySelector("#user_template");
  let parent = template.parentElement;
  parent.removeChild(template);

  show_message(lightdm.select_user);

  for (var user of lightdm.users) {
    userNode = template.cloneNode(true);

    let image = userNode.querySelectorAll(".user_image")[0];
    let name = userNode.querySelectorAll(".user_name")[0];
    name.innerText = user.display_name;

    if (user.image) {
      image.src = user.image;
      image.onerror = on_image_error;
    } else {
      image.src = "img/avatar.png";
    }

    userNode.id = user.name;
    userNode.onclick = user_clicked;
    parent.appendChild(userNode);
  }
}

function initialize_sessions() {
  let template = document.querySelector("#session_template");
  let container = template.parentElement;
  container.removeChild(template);

  for (var session of lightdm.sessions) {
    let s = template.cloneNode(true);

    s.innerText = session.name;
    s.value = session.key;

    container.appendChild(s);
  }
}

function on_image_error(e) {
  e.currentTarget.src = "img/avatar.png";
}

window.addEventListener("load", () => {
  initialize_users();
  initialize_sessions();
  document.querySelector("#hostname").innerText = lightdm.hostname;
  document.body.style.opacity = 1;
});

window.addEventListener("keypress", (e) => {
  if (!clicked && (e.keyCode == 32 || e.keyCode == 13)) {
    clicked = true;
    show_message("Authenticating");
    start_authentication(lightdm.users[0].name);
    return;
  }
  if (clicked && e.keyCode == 27) {
    user_clicked("");
    return;
  }
});