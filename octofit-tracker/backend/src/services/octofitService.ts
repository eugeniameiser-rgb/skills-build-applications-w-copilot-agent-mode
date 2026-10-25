import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(_input: unknown) {
  if (!_input || typeof _input !== 'object') {
    throw Object.assign(new Error('Activity input must be an object'), { status: 400 });
  }

  const input = _input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = input;
  const isObjectId = (value: unknown): value is string =>
    typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

  if (
    !isObjectId(userId) ||
    !isObjectId(teamId) ||
    typeof type !== 'string' ||
    !type.trim() ||
    typeof minutes !== 'number' ||
    !Number.isFinite(minutes) ||
    minutes < 1
  ) {
    throw Object.assign(new Error('Activity input is invalid'), { status: 400 });
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(_input: unknown) {
  if (!_input || typeof _input !== 'object') {
    throw Object.assign(new Error('Team input must be an object'), { status: 400 });
  }

  const input = _input as Record<string, unknown>;
  const { name, mascot } = input;
  const members = input.members ?? [];
  const isObjectId = (value: unknown): value is string =>
    typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    typeof mascot !== 'string' ||
    !mascot.trim() ||
    !Array.isArray(members) ||
    !members.every(isObjectId)
  ) {
    throw Object.assign(new Error('Team input is invalid'), { status: 400 });
  }

  const memberIds = [...new Set(members)];
  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (existingMembers.length !== memberIds.length) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members });
}

export async function getLeaderboard() {
  const teams = await Team.aggregate<{ teamName: string; totalPoints: number }>([
    {
      $lookup: {
        from: Activity.collection.name,
        localField: '_id',
        foreignField: 'team',
        as: 'activities',
      },
    },
    {
      $project: {
        _id: 0,
        teamName: '$name',
        totalPoints: { $sum: '$activities.points' },
      },
    },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return teams.map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const goal = user.fitnessGoal.trim().toLowerCase();
  const activityType = recentActivity?.type.trim().toLowerCase();
  const activityFocus = activityType
    ? ({ run: 'endurance', running: 'endurance', cycle: 'endurance', cycling: 'endurance', walk: 'endurance' }[activityType] ?? activityType)
    : undefined;
  const focusFor = (focus: string) => focus.trim().toLowerCase();
  const goalMatch = workouts.some((workout) => focusFor(workout.focus) === goal);
  const recommendedFocus = goalMatch ? goal : activityFocus;
  const reason = (focus: string) => {
    if (focusFor(focus) === goal) return `Recommended for your ${user.fitnessGoal} goal`;
    if (activityType && focusFor(focus) === activityFocus) return `Recommended based on your recent ${recentActivity?.type} activity`;
    return `Suggested workout to support your ${user.fitnessGoal} goal`;
  };
  const orderedWorkouts = recommendedFocus
    ? [...workouts].sort((left, right) => Number(focusFor(right.focus) === recommendedFocus) - Number(focusFor(left.focus) === recommendedFocus))
    : workouts;

  return orderedWorkouts.map((workout) => ({ ...workout, reason: reason(workout.focus) }));
}

export { User };
