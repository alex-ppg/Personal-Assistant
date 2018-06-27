if (typeof process !== "undefined" && process.env !== undefined) {
  process.env.LOG = 'ERROR'
} else {
  window.LOG = 'ERROR'
}

const Logger = require('logplease');
const moment = require('moment');

const logger = Logger.create('PA');

const PA = new Object();

let userMessageElement,       // User message element
    botMessageElement,        // Bot message element
    messageContainerElement,  // Element to append messages to
    timeBreakElement,         // Optional timebreak element
    lastTimestamp,            // moment.js timestamp
    welcomeMessage,           // First-time message
    messagePaths,             // Message paths
    timeMessages;             // Time-aware messages

const _writeTime = () => {
  if (timeBreakElement === undefined || moment().isBefore(lastTimestamp.add(5, 'minutes'))) return;

  lastTimestamp = moment();
  // Clone the time-break element
  let currentElement = timeBreakElement.cloneNode(true);
  // Reset its display style
  currentElement.style.display = 'inherit';

  currentElement.innerHTML = lastTimestamp.format('ddd h:mm a')

  messageContainerElement.appendChild(currentElement);
}

const _timeAwareWelcome = () => {
  let currentHour = parseInteger(lastTimestamp.format("HH"));

  if (currentHour <= 5 || currentHour >= 22) {
    logger.debug("Detected after-hours");
    _write(timeMessages[0]);
  } else if (currentHour <= 12) {
    logger.debug("Detected morning");
    _write(timeMessages[1]);
  } else if (currentHour <= 17) {
    logger.debug("Detected evening");
    _write(timeMessages[2]);
  } else {
    logger.debug("Detected afternoon");
    _write(timeMessages[3]);
  }
}

const _randomPrompt = () => {
  let seed = Math.floor((Math.random() * 5) + 1);
  switch (seed) {
    case 1: {
      return "Is there anything specific you would like help with?";
    }
    case 2: {
      return "What may I help you with?";
    }
    case 3: {
      return "Can I do anything for you?";
    }
    case 4: {
      return "Do you have any question in mind?";
    }
    case 5: {
      return "Would you like me to help you with something?";
    }
  }
}

const _write = async (msg, bot, timeout) => {
  await new Promise((resolve, reject) => setTimeout(() => {resolve()}, timeout * 1000));
  let element = (bot?botMessageElement:userMessageElement).cloneNode(true);
  // Reset its display style
  element.style.display = 'inherit';
  element.innerHTML = msg;
  messageContainer.appendChild(element);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

const _clickElement = async (selector, timeout) => {
  await new Promise((resolve, reject) => setTimeout(() => {resolve()}, timeout * 1000));
  const element = document.querySelector(selector);
  element.click();
  element.focus();
  return Promise.resolve(true);
}

const _inputElement = async (selector, message, timeout) => {
  await new Promise((resolve, reject) => setTimeout(() => {resolve()}, timeout * 1000));
  // Simulate input event for filtering and Angular
  const event = new Event('input', {
      'bubbles': true,
      'cancelable': true
  });
  await new Promise((resolve, reject) => setTimeout(() => {element.value = text.charAt(0);resolve();}, Math.random() * 100));
  message = text.substring(1);
  // We need to save the size because we edit the text directly and offset it by 1
  let loopLength = text.length + 1;
  for (let i = 1; i < loopLength; i++) {
    await new Promise((resolve, reject) => setTimeout(() => {
      // Fix for number inputs
      if (message.charAt(0) === '.') {
        element.value += text.substring(0,2);
        text = text.substring(2);
      } else {
        element.value += text.charAt(0);
        text = text.substring(1);
      }
      element.dispatchEvent(event);
      resolve();
    }, Math.random() * 100));
  }
  return Promise.resolve(true);
}

PA.init = (messageContainer, botMessage, userMessage, timeBreak) => {
  // Make sure selectors exist
  messageContainerElement = document.querySelector(messageContainer);
  botMessageElement = document.querySelector(botMessage);
  userMessageElement = document.querySelector(userMessage);
  timeBreakElement = document.querySelector(timeBreak);
  lastTimestamp = moment();
  if (messageContainerElement === null) {
    logger.error("Message container not found, make sure the first argument is a valid selector");
  } else if (messageContainerElement === null) {
    logger.error("Bot message container not found, make sure the second argument is a valid selector");
  } else if (userMessageElement === null) {
    logger.error("User message container not found, make sure the third argument is a valid selector");
  } else if (timeBreakElement === null && timeBreak !== undefined) {
    logger.error("Time break container not found, make sure the optional fourth argument is a valid selector");
  }

  // Fill time messages Array
  timeMessages.push("Welcome, I am Arcty and I will be your digital assistant for the day");
  timeMessages.push("Good morning and welcome to our website, my name is Arcty and I will be your digital assistant");
  timeMessages.push("Good afternoon and thank you for visiting our website, my name is Arcty and I will be your assistant for the day");
  timeMessages.push("Good evening, I am Arcty and I am more than happy to help you with anything you need");
}

PA.welcome = () => {
  if (localStorage.getItem('PA-first-time') === null) {
    logger.debug("First time user, showing welcome message")
    _writeTime();
    _write(welcomeMessage, 1);
    _write(_randomPrompt(), 2);
    localStorage.setItem('PA-first-time', 0);
  } else {
    logger.debug("Recurring user, showing time-aware message")
    _write(_timeAwareWelcome(), 1);
    _write(_randomPrompt(), 2);
  }
}

PA.setWelcome = (msg) => {
  if (msg instanceof String) {
    logger.debug("Setting welcome message to " + msg);
    welcomeMessage = msg;
  } else {
    logger.error("Invalid msg type, expected String but got " + typeof msg)
  }
}

PA.debug = () => {
  if (typeof process !== "undefined" && process.env !== undefined) {
    process.env.LOG = 'DEBUG'
  } else {
    window.LOG = 'DEBUG'
  }
}

PA.setTimeMessage = (newTime) => {
  if (newTime instanceof Array) {
    timeMessages = newTime;
  } else {
    let { index, message } = newTime;
    if (Number.isInteger(index) && message instanceof String) {
      logger.debug("Changing message at index " + index + " with content " + message);
      timeMessages[index] = message;
    } else {
      logger.error("Invalid input for changing time message. Expected Integer and String but got " + (typeof index) + " and " + (typeof message));
    }
  }
}

PA.addPath = (regex, subpath, answer) => {
  if (regex !== undefined) {
    if (answer === undefined) {
      if (subpath === undefined) {
        messagePaths[regex.toString()] = undefined;
      } else {
        let pathString = 'messagePaths';
        for (let i = 0; i < subpath.length; i++) {
          pathString += `[subpath[${i}]]`;
        }
        eval(`${pathString} = { ${regex.toString()} : undefined }`);
      }
    } else {
      if (subpath === undefined) {
        messagePaths[regex.toString()] = answer;
      } else {
        let pathString = 'messagePaths';
        for (let i = 0; i < subpath.length; i++) {
          pathString += `[subpath[${i}]]`;
        }
        eval(`${pathString} = { ${regex.toString()} : answer }`);
      }
    }
  } else {
    logger.error("Invalid regular expression specified, expected RegExp or String but got " + regex);
  }
}

PA.verify = (toVerify) => {
  if (toVerify === undefined) {
    toVerify = messagePaths;
  }

  let keys = Object.keys(toVerify);

  for (let i = 0; i < keys.length; i++) {
    if (toVerify[keys[i]] instanceof Object) {
      if (!PA.verify(toVerify[keys[i]])) {
        return false;
      }
    } else if (toVerify[keys[i]] === undefined) {
      return false;
    }
  }

  return true;
}

PA.evaluate = (msg, currentPath) => {
  if (currentPath === undefined) {
    currentPath = messagePaths;
  }

  let keys = Object.keys(currentPath);

  let answer;

  for (let i = 0; i < keys.length; i++) {
    if ((new RegExp(keys[i])).test(msg)) {
      if (currentPath[keys[i]] instanceof Object) {
        return PA.evaluate(msg, currentPath[keys[i]]);
      } else {
        return currentPath[keys[i]];
      }
    }
  }

  return answer;
}

PA.actuate = async (action) => {
  if (action instanceof String) {
    await _write(action, 1);
  } else {
    action.forEach((el) => {
      if (el.type === 1) {
        await _clickElement(el.selector, el.timeout);
      } else {
        await _inputElement(el.selector, el.text, el.timeout);
      }
    })
  }
}

module.exports = PA;
