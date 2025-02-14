const bottomNavComponent = `
    <div class="navbar btm-nav fixed bottom-0 left-0 w-full flex justify-around">
        <a href="/pages/home.html" class="nav-link focus:outline-none hover:bg-gray-200" wire:navigate>
            <i class="fa-regular fa-grid-2 text-xl"></i>
        </a>
        <a href="/pages/forms/index.html" class="nav-link focus:outline-none hover:bg-gray-200" wire:navigate>
            <i class="fas fa-chart-bar text-xl"></i>
        </a>
        <a href="/pages/download/index.html" class="nav-link focus:outline-none hover:bg-gray-200" wire:navigate>
            <i class="fa-regular fa-download text-xl"></i>
        </a>
        <a href="/pages/settings/index.html" class="nav-link focus:outline-none hover:bg-gray-200" wire:navigate>
            <i class="fa-regular fa-gear text-xl"></i>
        </a>
    </div>`;

function alertContainer(data) {
    return `
        <div class="pt-20 text-center">
            <i class="fas ${data.icon} text-3xl text-primary"></i>
            <h3 class="text-base font-bold opacity-60 mt-3">${data.title}</h3>
            <p class="text-sm text-gray-400 mt-3">${data.message}</p>
        </div>
    `;
}

// document ready function
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById("navigationBar").innerHTML = bottomNavComponent;
    
    let links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            //e.preventDefault();
            links.forEach(item => item.classList.remove('text-green-400'));
            this.classList.add('text-green-400');
        });

        if(link.href === window.location.href){
            link.classList.add('active');
            link.classList.add('text-green-400');
        }
    });
});