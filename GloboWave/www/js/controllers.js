angular.module('WaveApp')

.controller('AppCtrl', function($scope, waveService, $timeout, $state) {

    var amp = 0;
    var siriWave = new SiriWave({
        container: document.getElementById('wave-container'),
        height: 80,
        width: 600,
        cover: true,
        amplitude: amp,
        speed: 0.15,
        color: '#EC7D00'
    });

    siriWave.start();


    $scope.cards = [];

    var card = {};
    card.title = "Vote em sua voz favorita!";
    card.caption = "The Voice";
    card.date = "Há 2 Dias";
    card.img = "img/thevoice.jpg";
    $scope.cards.push(card);

    card = {};
    card.title = "Croquete de Aipim Cremoso";
    card.caption = "Mais Você";
    card.date = "Ontem";
    card.img = "img/aipim.jpeg";
    $scope.cards.push(card);

    $scope.openPage = function(card) {
        if(card.is_merchan && cordova) 
            cordova.InAppBrowser.open('https://hackathonglobo.github.io/checkoutPage/', '_blank');
        else
            $state.go('aipim');
    }

    $scope.toggleAudio = function() {
        amp = amp + 1 % 2;
        siriWave.setAmplitude(amp);
        if(amp) {
            runAudio();
        } else {
            audioinput.stop();
        }
    }


    $scope.fetchCard = function(code) {

        if(code == $scope.lastFetch) return;

        $scope.lastFetch = code;
        waveService.fetch(code).then(function(response) {
            var card = response.data;

            card.date = card.is_merchan ? 'Patrocinado' : 'Agora';

            $scope.cards.push(card);

            if(navigator.vibrate)
                navigator.vibrate(50);
        });
    }

    function runAudio() {

        if(typeof audioinput == "undefined") return;

        audioinput.start({
            streamToWebAudio: true
        }); 

        amp = 1;
        siriWave.setAmplitude(amp);
        analyser = audioinput.getAudioContext().createAnalyser();
        analyser.fftSize = 2048;
        audioinput.connect(analyser);

        var dataArray = new Uint8Array(analyser.frequencyBinCount); // Uint8Array should be the same length as the frequencyBinCount 

        analyseCycle();

        function analyseCycle() {
            if (!audioinput.isCapturing()) {
                audioinput.start({
                    streamToWebAudio: true
                });
            }
            analyser.getByteFrequencyData(dataArray);
            // 21k
            if(dataArray[896] > 100) {
                $scope.fetchCard(1);
                audioinput.stop();
                $timeout(analyseCycle, 12000);
            // 21.5k   
            } else if (dataArray[917] > 100) {
                $scope.fetchCard(2);
                audioinput.stop();
                $timeout(analyseCycle, 12000);
            } else {
                $timeout(analyseCycle, 500);
            }
        }
    }

    $timeout(runAudio, 1000);

})

.controller("CheckoutCtrl", function($scope) {
})

.service('waveService', function($q, $http, endpoint) {
    this.fetch = function(code) {
        return $http.get(endpoint+'/waves?code='+code);
    }
})

.directive('backImg', function() {
    return function(scope, element, attrs) {
        attrs.$observe('backImg', function(value) {
            element.css({
                'background-image': 'url(' + value + ')',
                'background-size': 'cover'
            });
        });
    };
})

.filter('reverse', function() {
    return function(items) {
        return items.slice().reverse();
    };
})
