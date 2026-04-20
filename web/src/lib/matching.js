function urgencyWeight(urgency) {
  if (urgency === 'high') return 20;
  if (urgency === 'medium') return 10;
  return 5;
}

function skillWeight(category, skills) {
  if (category === 'medical' && skills.includes('medical')) return 50;
  if ((category === 'food' || category === 'water' || category === 'general relief') && skills.includes('delivery')) return 50;
  return 15;
}

function distanceBonus(request, volunteer) {
  const latDelta = request.lat - volunteer.lat;
  const lngDelta = request.lng - volunteer.lng;
  const distance = Math.sqrt(latDelta * latDelta + lngDelta * lngDelta);
  return Math.max(0, Math.round(30 - distance * 100));
}

function scoreVolunteer(request, volunteer) {
  let score = 0;
  score += urgencyWeight(request.urgency);
  score += skillWeight(request.category, volunteer.skills);
  score += volunteer.available ? 30 : -100;
  score += distanceBonus(request, volunteer);
  return score;
}

function rationaleFor(request, volunteer) {
  return `${volunteer.name} was chosen for ${request.category} because they are available now, have relevant skills, and are one of the closest volunteers.`;
}

export function matchAllRequests(requests, volunteers) {
  const nextVolunteers = volunteers.map((volunteer) => ({ ...volunteer }));
  const nextRequests = requests.map((request) => ({ ...request }));

  const pendingRequests = nextRequests
    .filter((request) => request.status === 'pending')
    .sort((a, b) => urgencyWeight(b.urgency) - urgencyWeight(a.urgency));

  for (const request of pendingRequests) {
    const availableVolunteers = nextVolunteers.filter((volunteer) => volunteer.available);
    if (!availableVolunteers.length) {
      continue;
    }

    const bestVolunteer = [...availableVolunteers].sort(
      (a, b) => scoreVolunteer(request, b) - scoreVolunteer(request, a)
    )[0];

    if (!bestVolunteer) {
      continue;
    }

    request.status = 'assigned';
    request.assignedVolunteerId = bestVolunteer.id;
    request.assignedVolunteerName = bestVolunteer.name;
    request.assignmentRationale = rationaleFor(request, bestVolunteer);
    request.assignedAt = Date.now();

    const targetVolunteer = nextVolunteers.find((volunteer) => volunteer.id === bestVolunteer.id);
    targetVolunteer.available = false;
    targetVolunteer.currentStatus = `assigned to ${request.id}`;
  }

  return { requests: nextRequests, volunteers: nextVolunteers };
}
