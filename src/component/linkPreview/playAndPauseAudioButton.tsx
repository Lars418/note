import React, {useEffect, useRef, useState} from 'react';
import useIntl from "@src/hook/useIntl";
import {PauseCircle, PlayCircle} from "react-feather";
import './playAndPauseAudioButton.min.css';
import {Formatter} from "@src/utils/formatter";

interface IPlayAndPauseAudioButton {
    audioUrl: string;
    type: string;
}

const PlayAndPauseAudioButton: React.FC<IPlayAndPauseAudioButton> = (props) => {
    const { audioUrl, type } = props;
    const intl = useIntl();
    const audioRef = useRef<HTMLAudioElement>();
    const [isPlaying, setIsPlaying] = useState<boolean>(false);
    const [audioLength, setAudioLength] = useState<string>('');
    const [timestamp, setTimestamp] = useState<string>('');

    const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
            return;
        }

        setIsPlaying(true);
        const formattedAudioLength = await Formatter.formatDuration(audioRef.current.duration);
        setAudioLength(formattedAudioLength);
        await audioRef.current.play();
    };

    const handleOnEnd = () => {
      setIsPlaying(false);
      setTimestamp('');
    };

    const handleTimeUpdate = async (event: React.SyntheticEvent<HTMLAudioElement>) => {
        const formattedTimestamp = await Formatter.formatDuration(event.currentTarget.currentTime);
        setTimestamp(formattedTimestamp);
    };

    return (
        <div className="playAndPauseAudioButton-wrapper">
            <button
                className="playAndPauseAudioButton"
                onClick={handleClick}
                title={isPlaying
                    ? intl.formatMessage('pauseAudioButton', { type })
                    : intl.formatMessage('playAudioButton', { type })
                }
            >
                {
                    isPlaying ? (
                        <PauseCircle role="img" />
                    ) : (
                        <PlayCircle role="img" />
                    )
                }
            </button>

            <span
                className="playAndPauseAudioButton-details"
                hidden={!isPlaying}
            >
                {timestamp} / {audioLength}
            </span>

            <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={handleOnEnd}
                onTimeUpdate={handleTimeUpdate}
            />
        </div>
    )

}

export default PlayAndPauseAudioButton;
