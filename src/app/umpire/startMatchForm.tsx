'use client';

import { useForm } from 'react-hook-form';
import Input from '@/components/Input';
import { BlueBtn, SmallBtns } from '@/components/Styles';
import RadioGroup from '@/components/RadioGroup';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoadingOverlay from '@/components/LoadingOverlay';

export function StartMatchForm() {
    const { register, handleSubmit, formState, setValue } = useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { errors } = formState
    const router = useRouter();

    async function createMatch(formData: any) {
        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to create match");
            }

            const data: any = await res.json();
            sessionStorage.setItem('matchId', data._id);
            router.replace(`/umpire/${data._id}`);
        } catch (err: any) {
            setError(err.message);
            if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
                window.showToast("Something went wrong.", "error");
            }
        } finally {
            setLoading(false);
        }
    }

    const setOvers = (value: number) => {
        setValue('totalOvers', value, { shouldValidate: true });
    };

    const setPlayers = (value: number) => {
        setValue('noOfPlayers', value, { shouldValidate: true });
    };

    return (
        <form onSubmit={handleSubmit(createMatch)} className="space-y-4">
            <Input
                label="Location"
                type="string"
                {...register('location', {
                    required: 'Location is required',
                    minLength: {
                        value: 2,
                        message: 'Location must be at least 2 characters'
                    },
                    maxLength: {
                        value: 50,
                        message: 'Location must not exceed 50 characters'
                    }
                })}
                error={errors.location?.message}
                required
            />

            <Input
                label="Team A name"
                type="string"
                {...register('teamAName', {
                    required: 'Team A name is required',
                    minLength: {
                        value: 2,
                        message: 'Team name must be at least 2 characters'
                    },
                    maxLength: {
                        value: 50,
                        message: 'Team name must not exceed 50 characters'
                    }
                })}
                error={errors.teamAName?.message}
                required
            />

            <Input
                label="Team B name"
                type="string"
                {...register('teamBName', {
                    required: 'Team B name is required',
                    minLength: {
                        value: 2,
                        message: 'Team name must be at least 2 characters'
                    },
                    maxLength: {
                        value: 50,
                        message: 'Team name must not exceed 50 characters'
                    }
                })}
                error={errors.teamBName?.message}
                required
            />

            <div>
                <Input
                    label="Number of players in each team"
                    type="number"
                    min={1}
                    {...register('noOfPlayers', {
                        required: 'Number of players is required',
                        min: {
                            value: 1,
                            message: 'Must have at least 1 player'
                        },
                        max: {
                            value: 11,
                            message: 'Cannot exceed 11 players'
                        },
                        valueAsNumber: true,
                        validate: value => value >= 1 || 'Number must be positive'
                    })}
                    error={errors.noOfPlayers?.message}
                    required
                />
                <div className="flex gap-2 mt-2">
                    <button
                        type="button"
                        onClick={() => setPlayers(5)}
                        className={SmallBtns}
                    >
                        5 Players
                    </button>
                    <button
                        type="button"
                        onClick={() => setPlayers(10)}
                        className={SmallBtns}
                    >
                        10 Players
                    </button>
                    <button
                        type="button"
                        onClick={() => setPlayers(11)}
                        className={SmallBtns}
                    >
                        11 Players
                    </button>
                </div>
            </div>
            <div>
                <RadioGroup
                    label="Toss won by"
                    options={[
                        { value: 'teamA', label: 'Team A' },
                        { value: 'teamB', label: 'Team B' }
                    ]}
                    {...register('tossWonBy', {
                        required: 'Please select which team won the toss'
                    })}
                    error={errors.tossWonBy?.message}
                    required
                />
            </div>

            <div>
                <Input
                    label="Total overs"
                    type="number"
                    min={1}
                    {...register('totalOvers', {
                        required: 'Total overs is required',
                        min: {
                            value: 1,
                            message: 'Must have at least 1 over'
                        },
                        max: {
                            value: 50,
                            message: 'Cannot exceed 50 overs'
                        },
                        valueAsNumber: true,
                        validate: value => value > 0 || 'Total overs must be positive'
                    })}
                    error={errors.totalOvers?.message}
                    required
                />
                <div className="flex gap-2 mt-2">
                    <button
                        type="button"
                        onClick={() => setOvers(5)}
                        className={SmallBtns}
                    >
                        5 Overs
                    </button>
                    <button
                        type="button"
                        onClick={() => setOvers(10)}
                        className={SmallBtns}
                    >
                        10 Overs
                    </button>
                    <button
                        type="button"
                        onClick={() => setOvers(15)}
                        className={SmallBtns}
                    >
                        15 Overs
                    </button>
                </div>
            </div>

            <button
                type="submit"
                className={`${BlueBtn} mt-4 w-full ${loading || !formState.isValid ? 'bg-gray-400 cursor-not-allowed' : ''}`}
                disabled={loading || !formState.isValid}
            >
                Start Match
            </button>
            {error && <p className="text-red-500">{error}</p>}
            {loading && <LoadingOverlay />}
        </form>
    );
}