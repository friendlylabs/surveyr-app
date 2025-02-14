function buttonState(button, state, initialText=null) {

    if (typeof button === 'string') {
        button = $(button);
    }

    if (state === 'loading') {
        button.attr('disabled', true);
        button.html('<i class="fas fa-spinner fa-spin"></i>');
    } else {
        button.attr('disabled', false);
        button.html(initialText);
    }
}

function submitForm(event) {
    event.preventDefault();

    const form = $(event.target);
    const isMultipart = form.attr('enctype') === 'multipart/form-data';
    let formData = isMultipart ? new FormData(event.target) : form.serialize();

    // Retrieve preRequestHandler and postRequestHandler from data attributes
    const preRequestHandler = form.data('pre-request');
    const postRequestHandler = form.data('post-request');

    if (preRequestHandler && typeof window[preRequestHandler] === 'function') {
        window[preRequestHandler]();
    }

    const submitButton = form.find('button[type="submit"]');
    const buttonLabel = submitButton.html() ?? null;
    if (submitButton) {
        buttonState(submitButton, 'loading');
    }

    $.ajax({
        url: form.attr('action'),
        method: form.attr('method') ?? 'POST',
        data: formData,
        processData: !isMultipart,
        contentType: isMultipart ? false : 'application/x-www-form-urlencoded; charset=UTF-8',
        success: function(response) {
            if (postRequestHandler && typeof window[postRequestHandler] === 'function') {
                window[postRequestHandler](response);
            } else {
                if (response.status) {
                    toast.success({ message: response.message });
                } else {
                    toast.error({ message: response.message });
                }
                if (response.redirect) {
                    setTimeout(() => {
                        window.location.href = response.redirect;
                    }, 1000);
                }
            }
        },
        error: function(xhr, status, error) {
            if (xhr.status === 0) {
                let response = { status: false, message: 'Cannot connect to the server' };
                if (postRequestHandler && typeof window[postRequestHandler] === 'function') {
                    window[postRequestHandler](response);
                } else {
                    toast.error({ message: response.message });
                }
            }
        
            try {
                if (xhr.responseJSON) {
                    if (postRequestHandler && typeof window[postRequestHandler] === 'function') {
                        window[postRequestHandler](xhr.responseJSON);
                    } else {
                        toast.error({ message: xhr.responseJSON.message });
                    }
                }
            } catch (e) {
                let response = { status: false, message: 'Unknown Error Occurred' };
                if (postRequestHandler && typeof window[postRequestHandler] === 'function') {
                    window[postRequestHandler](response);
                } else {
                    toast.error({ message: 'Unknown Error Occurred' });
                }
            }
        },
        complete: function() {
            if (submitButton) {
                buttonState(submitButton, 'reset', buttonLabel);
            }
        }
    });
}

// data-theme="lofi|dim"
function toggleTheme(){
    let currentTheme = localStorage.getItem('theme') || 'lofi';
    let newTheme = currentTheme === 'lofi' ? 'dim' : 'lofi';

    if(document.getElementById('themeIcon')){
        if(currentTheme === 'lofi'){
            document.getElementById('themeIcon').classList.remove('fa-moon');
            document.getElementById('themeIcon').classList.add('fa-sun');
        }else{
            document.getElementById('themeIcon').classList.remove('fa-sun');
            document.getElementById('themeIcon').classList.add('fa-moon');
        }
    }

    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
}

function setTheme(){
    let currentTheme = localStorage.getItem('theme') || 'lofi';
    document.documentElement.setAttribute('data-theme', currentTheme);

    if(document.getElementById('themeIcon')){
        if(currentTheme === 'lofi'){
            document.getElementById('themeIcon').classList.remove('fa-sun');
            document.getElementById('themeIcon').classList.add('fa-moon');
        }else{
            document.getElementById('themeIcon').classList.remove('fa-moon');
            document.getElementById('themeIcon').classList.add('fa-sun');
        }
    }
}


function checkConnectivity(){
        if(!navigator.onLine){
            toast.error({ message: 'No internet connection' });
            return false;
        }

    return true;
}

async function checkDatabaseExists(database) {
    let exists = await Dexie.exists(database);
    return exists;
}

function underDevelopment(event){
    event.preventDefault();
    Swal.fire({
        title: 'Under Development',
        text: 'This feature is under development',
        confirmButtonText: 'OK'
    });
}

function openInWebview(event) {
    event.preventDefault();  
    let url = event.target.href;
    
    if (window.cordova && cordova.InAppBrowser) {
        cordova.InAppBrowser.open(url, '_blank', 'location=no,toolbar=yes');
    } else {
        window.open(url, '_blank');
    }
}

setTheme();

document.addEventListener('DOMContentLoaded', function() {
    if (typeof Alpine === 'undefined') {
        var script = document.createElement('script');
        script.src = '/js/alpine.wire.js';
        script.id = 'alpineJs';
        document.head.appendChild(script);
    }


    // authentication check
    if (typeof guestPage !== 'undefined' && localStorage.getItem('token')) {
        window.location.href = '/pages/home.html';
    }

    if(typeof guestPage === 'undefined'){
        let guestPage = false; if (!guestPage && !localStorage.getItem('token')) {
            window.location.href = '/';
        }
    }
});