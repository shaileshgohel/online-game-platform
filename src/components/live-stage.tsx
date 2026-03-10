import { Link2, Trophy, Users } from "lucide-react";

import type { HostRoomState } from "@/lib/game/types";

import { ChoiceTile } from "./choice-tile";
import { LeaderboardCard } from "./leaderboard-card";
import { QrPanel } from "./qr-panel";
import { TimerBadge } from "./timer-badge";

function responseCount(state: HostRoomState) {
  return state.liveStats.reduce((sum, stat) => sum + stat.count, 0);
}

export function LiveStage({
  state,
  showQr = false,
}: {
  state: HostRoomState;
  showQr?: boolean;
}) {
  const questionNumber = state.currentQuestionIndex + 1;
  const winner = state.finalLeaderboard[0];
  const reveal = state.reveal;

  return (
    <section className="glass-panel rounded-[36px] p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 uppercase tracking-[0.24em] text-slate-200">
              {state.quizTitle}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Room {state.roomCode}</span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {Math.max(questionNumber, 0)}/{state.totalQuestions} questions
            </span>
          </div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
            {state.status === "lobby" ? "Players are gathering" : state.question?.prompt ?? "Game over"}
          </h2>
          <p className="mt-3 max-w-3xl text-base text-slate-300 sm:text-lg">
            {state.status === "lobby"
              ? "Scan the QR code or enter the room code to join. The host can start whenever everyone is ready."
              : state.status === "reveal"
                ? "Answers are locked. Fast correct responses earn the biggest score swings."
                : state.status === "ended"
                  ? "Final standings are in. Celebrate the winner and spin up another room when you are ready."
                  : "Players answer on their own devices while the main screen keeps the room moving."}
          </p>
        </div>

        {state.status === "inQuestion" && state.question ? (
          <TimerBadge startedAt={state.question.startedAt} durationMs={state.question.durationMs} />
        ) : null}
      </div>

      {state.status === "lobby" ? (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5">
            <div className="mb-4 flex items-center gap-3 text-slate-200">
              <Users className="h-5 w-5" />
              <span className="font-semibold">{state.playerCount} player{state.playerCount === 1 ? "" : "s"} in the room</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {state.players.length > 0 ? (
                state.players.map((player) => (
                  <div
                    key={player.id}
                    className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white"
                  >
                    {player.nickname}
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-white/10 px-5 py-8 text-slate-400">
                  Waiting for the first player to join.
                </div>
              )}
            </div>
          </div>

          {showQr ? (
            <QrPanel
              value={state.joinUrl}
              title="Scan to join"
              subtitle="Players can open the link or enter the room code from any phone or laptop."
            />
          ) : (
            <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 flex items-center gap-3 text-slate-200">
                <Link2 className="h-5 w-5" />
                <span className="font-semibold">Join instructions</span>
              </div>
              <div className="space-y-4 text-sm text-slate-300">
                <p>Share this link: {state.joinUrl}</p>
                <p>Project this stage view on the main screen: {state.stageUrl}</p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {state.status === "inQuestion" && state.question ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              {responseCount(state)} answer{responseCount(state) === 1 ? "" : "s"} received
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
              {state.connectedCount} connected now
            </span>
          </div>
          {state.question.imageUrl ? (
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04]">
              <img src={state.question.imageUrl} alt="Question visual" className="h-72 w-full object-cover" />
            </div>
          ) : null}
          <div className={`grid gap-5 ${state.question.choiceCount === 2 ? "md:grid-cols-2" : "md:grid-cols-2"}`}>
            {state.question.choices.map((choice, index) => {
              const stat = state.liveStats[index];
              return (
                <ChoiceTile
                  key={`${state.question?.questionIndex}-${choice.label}`}
                  index={index}
                  label={choice.label}
                  count={stat?.count ?? 0}
                  percentage={stat?.percentage ?? 0}
                />
              );
            })}
          </div>
        </div>
      ) : null}

      {state.status === "reveal" && state.question && reveal ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-3xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-emerald-100">
              <Trophy className="h-5 w-5" />
              Correct answer revealed. Score is based on both accuracy and speed.
            </div>
            {state.question.imageUrl ? (
              <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.04]">
                <img src={state.question.imageUrl} alt="Question visual" className="h-64 w-full object-cover" />
              </div>
            ) : null}
            <div className={`grid gap-5 ${state.question.choiceCount === 2 ? "md:grid-cols-2" : "md:grid-cols-2"}`}>
              {state.question.choices.map((choice, index) => {
                const stat = reveal.stats[index];
                return (
                  <ChoiceTile
                    key={`${state.question?.questionIndex}-${choice.label}`}
                    index={index}
                    label={choice.label}
                    count={stat?.count ?? 0}
                    percentage={stat?.percentage ?? 0}
                    isCorrect={index === reveal.correctIndex}
                    isDimmed={index !== reveal.correctIndex}
                  />
                );
              })}
            </div>
          </div>
          <LeaderboardCard entries={reveal.leaderboard} />
        </div>
      ) : null}

      {state.status === "ended" ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.05] p-6">
            <p className="mb-2 text-sm uppercase tracking-[0.28em] text-cyan-200">Winner</p>
            <h3 className="font-display text-4xl font-semibold text-white">{winner?.nickname ?? "No winner yet"}</h3>
            <p className="mt-3 text-lg text-slate-300">
              {winner ? `${winner.scoreTotal} total points` : "Start a game to see scores here."}
            </p>
          </div>
          <LeaderboardCard entries={state.finalLeaderboard} title="Final standings" />
        </div>
      ) : null}
    </section>
  );
}
