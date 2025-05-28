import React, {useEffect, useState} from "react";
import "./common.scss"

const ResendOtp = ({onResend}) => {
    const TIME_INTERVAL = 60;
    const [resendOtpDisabled, setResendOtpDisabled] = useState(true);
    const [timeLeft, setTimeLeft] = useState(TIME_INTERVAL);
    const [attemptsLeft, setAttemptsLeft] = useState(2);

    useEffect(() => {
        if (timeLeft <= 0) {
            setResendOtpDisabled(false);
            return;
        }

        const interval = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft]);

    const handleResendClick = () => {
        if (attemptsLeft > 0) {
            onResend();
            setAttemptsLeft(attemptsLeft - 1);
            setTimeLeft(TIME_INTERVAL);
            setResendOtpDisabled(true);
        }

    }


    return (
			<div>
				{attemptsLeft <= 0 ? (
					<div className="warning_text">Maximum resend attempts reached.</div>
				) : timeLeft > 0 ? (
					<div className="info_text">Resend OTP in {timeLeft} seconds</div>
				) : (
					<button
						type="button"
						disabled={resendOtpDisabled || attemptsLeft <= 0}
						onClick={handleResendClick}
					>
						Resend OTP
					</button>
				)}
			</div>
		);
};

export default ResendOtp;



