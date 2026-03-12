"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import Input from "@/components/Input";
import LoadingOverlay from "@/components/LoadingOverlay";
import RadioGroup from "@/components/RadioGroup";

const LAST_MATCH_CONFIG_KEY = "gully_last_match_config";

type SavedMatchConfig = {
  location: string;
  teamAName: string;
  teamBName: string;
  noOfPlayers: number;
  totalOvers: number;
};

interface MatchFormValues {
  location: string;
  teamAName: string;
  teamBName: string;
  noOfPlayers: number;
  totalOvers: number;
  tossWonBy: string;
}

export function StartMatchForm() {
  const { register, handleSubmit, formState, setValue, reset } =
    useForm<MatchFormValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { errors } = formState;
  const router = useRouter();

  // Pre-fill form from last match config
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_MATCH_CONFIG_KEY);
      if (!saved) return;
      const config: SavedMatchConfig = JSON.parse(saved);
      setValue("location", config.location);
      setValue("teamAName", config.teamAName);
      setValue("teamBName", config.teamBName);
      setValue("noOfPlayers", config.noOfPlayers);
      setValue("totalOvers", config.totalOvers);
    } catch {
      // ignore malformed data
    }
  }, [setValue]);

  const createMatch: SubmitHandler<MatchFormValues> = async (formData) => {
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

      const data: { _id: string } = await res.json();
      sessionStorage.setItem("matchId", data._id);

      // Save config for "Play Again" pre-fill
      const config: SavedMatchConfig = {
        location: formData.location,
        teamAName: formData.teamAName,
        teamBName: formData.teamBName,
        noOfPlayers: formData.noOfPlayers,
        totalOvers: formData.totalOvers,
      };
      localStorage.setItem(LAST_MATCH_CONFIG_KEY, JSON.stringify(config));

      router.replace(`/umpire/${data._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      if (
        typeof window !== "undefined" &&
        typeof window.showToast === "function"
      ) {
        window.showToast("Something went wrong.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const setOvers = (value: number) => {
    setValue("totalOvers", value, { shouldValidate: true });
  };

  const setPlayers = (value: number) => {
    setValue("noOfPlayers", value, { shouldValidate: true });
  };

  return (
    <form onSubmit={handleSubmit(createMatch)} className="flex flex-col gap-4">
      <Input
        label="Location"
        type="string"
        {...register("location", {
          required: "Location is required",
          minLength: {
            value: 2,
            message: "Location must be at least 2 characters",
          },
          maxLength: {
            value: 50,
            message: "Location must not exceed 50 characters",
          },
        })}
        error={errors.location?.message}
        required
      />

      <Input
        label="Team A name"
        type="string"
        {...register("teamAName", {
          required: "Team A name is required",
          minLength: {
            value: 2,
            message: "Team name must be at least 2 characters",
          },
          maxLength: {
            value: 50,
            message: "Team name must not exceed 50 characters",
          },
        })}
        error={errors.teamAName?.message}
        required
      />

      <Input
        label="Team B name"
        type="string"
        {...register("teamBName", {
          required: "Team B name is required",
          minLength: {
            value: 2,
            message: "Team name must be at least 2 characters",
          },
          maxLength: {
            value: 50,
            message: "Team name must not exceed 50 characters",
          },
        })}
        error={errors.teamBName?.message}
        required
      />

      <div>
        <Input
          label="Number of players in each team"
          type="number"
          min={1}
          {...register("noOfPlayers", {
            required: "Number of players is required",
            min: {
              value: 1,
              message: "Must have at least 1 player",
            },
            max: {
              value: 11,
              message: "Cannot exceed 11 players",
            },
            valueAsNumber: true,
            validate: (value) => value >= 1 || "Number must be positive",
          })}
          error={errors.noOfPlayers?.message}
          required
        />
        <div className="form-chips">
          {[5, 10, 11].map((n) => (
            <button
              key={n}
              type="button"
              className="form-chip"
              onClick={() => setPlayers(n)}
            >
              {n} Players
            </button>
          ))}
        </div>
      </div>
      <div>
        <RadioGroup
          label="Toss won by"
          options={[
            { value: "teamA", label: "Team A" },
            { value: "teamB", label: "Team B" },
          ]}
          {...register("tossWonBy", {
            required: "Please select which team won the toss",
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
          {...register("totalOvers", {
            required: "Total overs is required",
            min: {
              value: 1,
              message: "Must have at least 1 over",
            },
            max: {
              value: 50,
              message: "Cannot exceed 50 overs",
            },
            valueAsNumber: true,
            validate: (value) => value > 0 || "Total overs must be positive",
          })}
          error={errors.totalOvers?.message}
          required
        />
        <div className="form-chips">
          {[5, 10, 15].map((n) => (
            <button
              key={n}
              type="button"
              className="form-chip"
              onClick={() => setOvers(n)}
            >
              {n} Overs
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="form-submit"
        disabled={loading || !formState.isValid}
      >
        Start Match
      </button>
      <button
        type="button"
        className="ump-delete-btn"
        onClick={() => reset()}
        disabled={loading}
      >
        Clear
      </button>
      {error && <p className="form-field-error">{error}</p>}
      {loading && <LoadingOverlay />}
    </form>
  );
}
