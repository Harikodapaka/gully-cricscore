import { useForm } from 'react-hook-form';
import Input from '@/components/Input';
import { BlueBtn } from '@/components/Styles';

export function StartMatchForm() {
    const { register, handleSubmit, formState: { errors }, setValue } = useForm();

    const onSubmit = (data: any) => {
        console.log(data);
    };

    const setOvers = (value: number) => {
        setValue('totalOvers', value, { shouldValidate: true });
    };

    const setPlayers = (value: number) => {
        setValue('noOfPlayers', value, { shouldValidate: true });
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                        valueAsNumber: true
                    })}
                    error={errors.noOfPlayers?.message}
                    required
                />
                <div className="flex gap-2 mt-2">
                    <button
                        type="button"
                        onClick={() => setPlayers(5)}
                        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                    >
                        5 Players
                    </button>
                    <button
                        type="button"
                        onClick={() => setPlayers(10)}
                        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                    >
                        10 Players
                    </button>
                    <button
                        type="button"
                        onClick={() => setPlayers(11)}
                        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                    >
                        11 Players
                    </button>
                </div>
            </div>

            <div>
                <Input
                    label="Total overs"
                    type="number"
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
                        valueAsNumber: true
                    })}
                    error={errors.totalOvers?.message}
                    required
                />
                <div className="flex gap-2 mt-2">
                    <button
                        type="button"
                        onClick={() => setOvers(5)}
                        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                    >
                        5 Overs
                    </button>
                    <button
                        type="button"
                        onClick={() => setOvers(10)}
                        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                    >
                        10 Overs
                    </button>
                    <button
                        type="button"
                        onClick={() => setOvers(15)}
                        className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
                    >
                        15 Overs
                    </button>
                </div>
            </div>

            <button type="submit" className={`${BlueBtn} mt-4`}>Start Match</button>
        </form>
    );
}