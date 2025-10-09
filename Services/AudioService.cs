using System;
using System.IO;
using System.Threading.Tasks;
using NAudio.Wave;

namespace LoLCustomGameHelper.Services
{
    public class AudioService
    {
        private WaveOutEvent? _waveOut;
        private AudioFileReader? _audioFileReader;

        public async Task PlaySoundAsync(string soundFilePath)
        {
            try
        {
            // Stop any currently playing sound
            StopSound();

            if (!File.Exists(soundFilePath))
            {
                Console.WriteLine($"Audio file not found: {soundFilePath}");
                return;
            }

            await Task.Run(() =>
            {
                try
                {
                    _audioFileReader = new AudioFileReader(soundFilePath);
                    _waveOut = new WaveOutEvent();
                    _waveOut.Init(_audioFileReader);
                    _waveOut.Play();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error playing audio: {ex.Message}");
                }
            });
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Audio playback error: {ex.Message}");
        }
        }

        public void StopSound()
        {
            try
            {
                _waveOut?.Stop();
                _waveOut?.Dispose();
                _audioFileReader?.Dispose();
                _waveOut = null;
                _audioFileReader = null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error stopping audio: {ex.Message}");
            }
        }

        public void Dispose()
        {
            StopSound();
        }
    }
}