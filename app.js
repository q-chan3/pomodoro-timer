document.addEventListener('DOMContentLoaded', () => {
    // 要素を取得
    const timeDisplay = document.getElementById('time');
    const startBtn = document.getElementById('startBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resetBtn = document.getElementById('resetBtn');
    const sessionCount = document.getElementById('sessionCount');
    const statusText = document.getElementById('status');
    const workDurationInput = document.getElementById('workDuration');
    const breakDurationInput = document.getElementById('breakDuration');
    const themeToggle = document.getElementById('themeToggle');
    
    // テーマの初期設定
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const currentTheme = localStorage.getItem('theme') || (prefersDarkScheme.matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    // テーマ切り替えイベントリスナー
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
    
    // システムのテーマ変更を検知
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) { // ユーザーが手動でテーマを設定していない場合のみ
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
    
    // 変数の初期化
    let timeLeft = 25 * 60; // 25分を秒で表現
    let timerId = null;
    let isPaused = true;
    let isWorkTime = true;
    let sessionsCompleted = 0;
    
    // 初期表示を更新
    updateDisplay();
    
    // イベントリスナーを設定
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    workDurationInput.addEventListener('change', updateDurations);
    breakDurationInput.addEventListener('change', updateDurations);
    
    // タイマーを開始する関数
    function startTimer() {
        if (isPaused) {
            isPaused = false;
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            timerId = setInterval(updateTimer, 1000);
        }
    }
    
    // タイマーを一時停止する関数
    function pauseTimer() {
        if (!isPaused) {
            isPaused = true;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            clearInterval(timerId);
        }
    }
    
    // タイマーをリセットする関数
    function resetTimer() {
        pauseTimer();
        isWorkTime = true;
        updateDurations();
        statusText.textContent = '作業時間';
        updateDisplay();
    }
    
    // タイマーを更新する関数
    function updateTimer() {
        if (timeLeft > 0) {
            timeLeft--;
            updateDisplay();
        } else {
            // 時間切れ
            clearInterval(timerId);
            
            // 通知音を再生
            playNotificationSound();
            
            // 作業時間と休憩時間を切り替え
            isWorkTime = !isWorkTime;
            
            if (!isWorkTime) {
                // 作業時間が終了（休憩時間に移行）
                sessionsCompleted++;
                sessionCount.textContent = sessionsCompleted;
                statusText.textContent = '休憩時間';
                timeLeft = parseInt(breakDurationInput.value) * 60;
            } else {
                // 休憩時間が終了（作業時間に移行）
                statusText.textContent = '作業時間';
                timeLeft = parseInt(workDurationInput.value) * 60;
            }
            
            // 次のセッションを自動的に開始
            startTimer();
        }
    }
    
    // 表示を更新する関数
    function updateDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    // 作業時間と休憩時間の設定を更新する関数
    function updateDurations() {
        if (isPaused) {
            timeLeft = isWorkTime ? 
                parseInt(workDurationInput.value) * 60 : 
                parseInt(breakDurationInput.value) * 60;
            updateDisplay();
        }
    }
    
    // 通知音を再生する関数
    function playNotificationSound() {
        // ブラウザのオーディオコンテキストを作成
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        
        // オシレーターノードを作成
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // オシレーターの設定
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // ラの音
        gainNode.gain.setValueAtTime(1, audioContext.currentTime);
        
        // エンベロープ設定（音の立ち上がりと減衰）
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        // ノードを接続
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // 音を鳴らす
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    }
});
