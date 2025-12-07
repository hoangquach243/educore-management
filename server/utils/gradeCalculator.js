export const calculateScores = (
  scores,
  weights
) => {
  const c = (scores.component || 0) * (weights.component / 100);
  const m = (scores.midterm || 0) * (weights.midterm / 100);
  const p = (scores.project || 0) * (weights.project / 100);
  const f = (scores.final || 0) * (weights.final / 100);

  // Round to 1 decimal place
  const final10 = Math.round((c + m + p + f) * 10) / 10;
  
  let final4 = 0;
  let letter = 'F';

  if (final10 >= 8.5) { final4 = 4.0; letter = 'A'; }
  else if (final10 >= 8.0) { final4 = 3.5; letter = 'B+'; }
  else if (final10 >= 7.0) { final4 = 3.0; letter = 'B'; }
  else if (final10 >= 6.5) { final4 = 2.5; letter = 'C+'; }
  else if (final10 >= 5.5) { final4 = 2.0; letter = 'C'; }
  else if (final10 >= 5.0) { final4 = 1.5; letter = 'D+'; }
  else if (final10 >= 4.0) { final4 = 1.0; letter = 'D'; }
  else { final4 = 0.0; letter = 'F'; }

  return { final10, final4, letter };
};

