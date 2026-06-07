import { useEffect, useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  getDocs,
} from "firebase/firestore";
import { auth, provider, db } from "./firebase";
import "./App.css";

const emptyProfile = {
  photo: "",
  major: "",
  graduationDate: "",
  availability: "",
  studyStyle: {
    environment: [],
    noise: [],
    goal: [],
    notes: "",
    saved: false,
  },
};

function App() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(emptyProfile);
  const [matchedGroups, setMatchedGroups] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  // Sign out and reset local state
  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(emptyProfile);
    setMatchedGroups([]);
    setCalendarEvents([]);
    setPage("account");
  };

  return (
    <main className="app">
      {page === "landing" && <LandingPage setPage={setPage} />}

      {page === "account" && (
        <AccountPage
          setPage={setPage}
          setUser={setUser}
          setProfile={setProfile}
        />
      )}

      {page === "profile" && (
        <ProfilePage
          setPage={setPage}
          user={user}
          profile={profile}
          handleSignOut={handleSignOut}
        />
      )}

      {page === "editProfile" && (
        <EditProfilePage
          setPage={setPage}
          user={user}
          profile={profile}
          setProfile={setProfile}
          handleSignOut={handleSignOut}
        />
      )}

      {page === "studyStyle" && (
        <StudyStylePage
          setPage={setPage}
          user={user}
          profile={profile}
          setProfile={setProfile}
          handleSignOut={handleSignOut}
        />
      )}

      {page === "home" && (
        <HomePage
          setPage={setPage}
          user={user}
          profile={profile}
          setMatchedGroups={setMatchedGroups}
          handleSignOut={handleSignOut}
        />
      )}

      {page === "findGroup" && (
        <FindGroupPage
          setPage={setPage}
          profile={profile}
          matchedGroups={matchedGroups}
          handleSignOut={handleSignOut}
        />
      )}

      {page === "createGroup" && (
        <CreateGroupPage
          setPage={setPage}
          user={user}
          profile={profile}
          handleSignOut={handleSignOut}
        />
      )}

      {page === "calendar" && (
        <CalendarPage
          setPage={setPage}
          user={user}
          calendarEvents={calendarEvents}
          setCalendarEvents={setCalendarEvents}
          handleSignOut={handleSignOut}
        />
      )}
    </main>
  );
}

function MinderLogo() {
  return (
    <div className="minderLogo">
      <div className="minderIcon">M</div>
      <div className="minderWord">Minder</div>
    </div>
  );
}

// Header used before the user is fully inside the app
function AuthHeader({ setPage }) {
  return (
    <header className="simpleHeader">
      <button type="button" onClick={() => setPage("landing")}>
        <MinderLogo />
      </button>
    </header>
  );
}

// Main navigation after login
function SimpleHeader({ setPage, handleSignOut }) {
  return (
    <header className="simpleHeader">
      <button type="button" onClick={() => setPage("home")}>
        <MinderLogo />
      </button>

      <nav className="topNav">
        <button type="button" onClick={() => setPage("home")}>
          Home
        </button>
        <button type="button" onClick={() => setPage("profile")}>
          Profile
        </button>
        <button type="button" onClick={() => setPage("calendar")}>
          Calendar
        </button>
        <button type="button" className="signOutBtn" onClick={handleSignOut}>
          Sign out
        </button>
      </nav>
    </header>
  );
}

function LandingPage({ setPage }) {
  return (
    <section className="landingPage">
      <div className="hero">
        <MinderLogo />
        <p className="mainTitle">UW Study Group Matcher</p>

        <h1>Find study groups that actually fit your schedule.</h1>

        <p className="description">
          Minder helps UW students connect with study partners based on courses,
          availability, study style, and group goals.
        </p>

        <button className="primaryBtn" onClick={() => setPage("account")}>
          Get Started
        </button>
      </div>
    </section>
  );
}

function AccountPage({ setPage, setUser, setProfile }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sign in with Google and check if it is a UW email
  const handleGoogleLogin = async () => {
    try {
      setErrorMessage("");
      setIsLoading(true);

      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      // Only allow UW accounts
      if (!googleUser.email || !googleUser.email.endsWith("@uw.edu")) {
        await signOut(auth);
        setErrorMessage("Please sign in with your UW email address.");
        setIsLoading(false);
        return;
      }

      const currentUser = {
        uid: googleUser.uid,
        name: googleUser.displayName || "UW Student",
        email: googleUser.email,
        photo: googleUser.photoURL || "",
      };

      // Check if this user already has a Firestore profile
      const userRef = doc(db, "users", googleUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        setProfile(data.profile || emptyProfile);
      } else {
        // Create a new user document for first-time users
        await setDoc(userRef, {
          uid: googleUser.uid,
          name: currentUser.name,
          email: currentUser.email,
          profile: emptyProfile,
        });
        setProfile(emptyProfile);
      }

      setUser(currentUser);
      setIsLoading(false);
      setPage("profile");
    } catch (error) {
      console.error(error);
      setErrorMessage("Login failed. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <section className="page">
      <AuthHeader setPage={setPage} />

      <div className="centerPanel">
        <h1>Connect your UW account</h1>
        <p>
          Use your real UW Google account to connect your profile and save your
          study preferences.
        </p>

        <div className="accountList">
          <button type="button" onClick={handleGoogleLogin}>
            <span className="dot blue"></span>
            {isLoading ? "Connecting..." : "Continue with UW Google Account"}
          </button>
        </div>

        <p className="authNote">
          Only <strong>@uw.edu</strong> accounts are allowed to enter Minder.
        </p>

        {errorMessage && <p className="errorText">{errorMessage}</p>}
      </div>
    </section>
  );
}

function ProfilePage({ setPage, user, profile, handleSignOut }) {
  return (
    <section className="page">
      <SimpleHeader setPage={setPage} handleSignOut={handleSignOut} />

      <div className="profilePage">
        <div className="profileHeaderCard">
          <h1>Profile setup</h1>
          <p>Complete your profile so Minder can recommend better groups.</p>

          {user?.email && (
            <p className="signedInText">Signed in as {user.email}</p>
          )}
        </div>

        <div className="profileSetupCard">
          <div className="profileTask" onClick={() => setPage("editProfile")}>
            <span>{profile.photo ? "✓" : "+"}</span>
            <p>
              {profile.photo ? "Edit profile picture" : "Add profile picture"}
            </p>
          </div>

          <div className="profileTask" onClick={() => setPage("editProfile")}>
            <span>{profile.major ? "✓" : "+"}</span>
            <p>{profile.major ? "Edit your major" : "Add your major"}</p>
          </div>

          <div className="profileTask" onClick={() => setPage("studyStyle")}>
            <span>{profile.studyStyle.saved ? "✓" : "+"}</span>
            <p>
              {profile.studyStyle.saved
                ? "Edit study style"
                : "Add study style"}
            </p>
          </div>

          <div className="profileTask" onClick={() => setPage("editProfile")}>
            <span>{profile.graduationDate ? "✓" : "+"}</span>
            <p>
              {profile.graduationDate
                ? "Edit graduation date"
                : "Add graduation date"}
            </p>
          </div>

          <div className="profileTask" onClick={() => setPage("editProfile")}>
            <span>{profile.availability ? "✓" : "+"}</span>
            <p>
              {profile.availability
                ? "Edit weekly availability"
                : "Add weekly availability"}
            </p>
          </div>

          <button className="primaryBtn" onClick={() => setPage("home")}>
            Go to Dashboard
          </button>
        </div>

        <div className="profileSummaryCard">
          <h2>Your saved profile</h2>
          <p>
            <strong>Major:</strong> {profile.major || "Not added yet"}
          </p>
          <p>
            <strong>Graduation date:</strong>{" "}
            {profile.graduationDate || "Not added yet"}
          </p>
          <p>
            <strong>Availability:</strong>{" "}
            {profile.availability || "Not added yet"}
          </p>
          <p>
            <strong>Environment:</strong>{" "}
            {profile.studyStyle.environment.join(", ") || "Not selected"}
          </p>
          <p>
            <strong>Study goal:</strong>{" "}
            {profile.studyStyle.goal.join(", ") || "Not selected"}
          </p>
        </div>
      </div>
    </section>
  );
}

function EditProfilePage({ setPage, user, profile, setProfile, handleSignOut }) {
  const [photo, setPhoto] = useState(profile.photo);
  const [major, setMajor] = useState(profile.major);
  const [graduationDate, setGraduationDate] = useState(profile.graduationDate);
  const [availability, setAvailability] = useState(profile.availability);

  // Save profile fields to Firestore
  const handleSave = async () => {
    const updatedProfile = {
      ...profile,
      photo,
      major,
      graduationDate,
      availability,
    };

    setProfile(updatedProfile);

    await setDoc(
      doc(db, "users", user.uid),
      { profile: updatedProfile },
      { merge: true }
    );

    setPage("profile");
  };

  return (
    <section className="page">
      <SimpleHeader setPage={setPage} handleSignOut={handleSignOut} />

      <div className="formPage">
        <div>
          <p className="smallTag">Profile</p>
          <h1>Edit your profile</h1>
          <p className="description">
            This information helps Minder match you with more relevant study
            groups.
          </p>
        </div>

        <div className="formCard">
          <label className="fieldLabel">Profile picture URL</label>
          <input
            className="textInput"
            placeholder="Paste an image URL"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
          />

          <label className="fieldLabel">Major</label>
          <input
            className="textInput"
            placeholder="Example: HCDE, Computer Science, Biology"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
          />

          <label className="fieldLabel">Graduation date</label>
          <input
            className="textInput"
            placeholder="Example: June 2026"
            value={graduationDate}
            onChange={(e) => setGraduationDate(e.target.value)}
          />

          <label className="fieldLabel">Weekly availability</label>
          <textarea
            placeholder="Example: Mon/Wed afternoon, weekends"
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          />

          <button className="primaryBtn" onClick={handleSave}>
            Save profile
          </button>
        </div>
      </div>
    </section>
  );
}

function StudyStylePage({ setPage, user, profile, setProfile, handleSignOut }) {
  const studyStyle = profile.studyStyle;

  // Add or remove checkbox options
  const toggleOption = (category, value) => {
    setProfile((prev) => {
      const currentList = prev.studyStyle[category];

      const updatedList = currentList.includes(value)
        ? currentList.filter((item) => item !== value)
        : [...currentList, value];

      return {
        ...prev,
        studyStyle: {
          ...prev.studyStyle,
          [category]: updatedList,
        },
      };
    });
  };

  // Save study style to Firestore
  const handleSave = async () => {
    const updatedProfile = {
      ...profile,
      studyStyle: {
        ...profile.studyStyle,
        saved: true,
      },
    };

    setProfile(updatedProfile);

    await setDoc(
      doc(db, "users", user.uid),
      { profile: updatedProfile },
      { merge: true }
    );

    setPage("profile");
  };

  return (
    <section className="page">
      <SimpleHeader setPage={setPage} handleSignOut={handleSignOut} />

      <div className="formPage">
        <div>
          <p className="smallTag">Personalization</p>
          <h1>
            {studyStyle.saved ? "Edit your study style" : "Add your study style"}
          </h1>
          <p className="description">
            These preferences help Minder recommend groups that match how and
            where you like to study.
          </p>
        </div>

        <div className="formCard">
          <FormSection title="Environment preference">
            <Check
              label="Cafe"
              checked={studyStyle.environment.includes("Cafe")}
              onChange={() => toggleOption("environment", "Cafe")}
            />
            <Check
              label="Library"
              checked={studyStyle.environment.includes("Library")}
              onChange={() => toggleOption("environment", "Library")}
            />
            <Check
              label="Quiet room"
              checked={studyStyle.environment.includes("Quiet room")}
              onChange={() => toggleOption("environment", "Quiet room")}
            />
            <Check
              label="Other"
              checked={studyStyle.environment.includes("Other")}
              onChange={() => toggleOption("environment", "Other")}
            />
          </FormSection>

          <FormSection title="Noise level preference">
            <Check
              label="Silent study sessions"
              checked={studyStyle.noise.includes("Silent study sessions")}
              onChange={() => toggleOption("noise", "Silent study sessions")}
            />
            <Check
              label="Low conversation"
              checked={studyStyle.noise.includes("Low conversation")}
              onChange={() => toggleOption("noise", "Low conversation")}
            />
            <Check
              label="Group discussion"
              checked={studyStyle.noise.includes("Group discussion")}
              onChange={() => toggleOption("noise", "Group discussion")}
            />
            <Check
              label="Flexible"
              checked={studyStyle.noise.includes("Flexible")}
              onChange={() => toggleOption("noise", "Flexible")}
            />
          </FormSection>

          <FormSection title="Study goal">
            <Check
              label="Homework help"
              checked={studyStyle.goal.includes("Homework help")}
              onChange={() => toggleOption("goal", "Homework help")}
            />
            <Check
              label="Exam review"
              checked={studyStyle.goal.includes("Exam review")}
              onChange={() => toggleOption("goal", "Exam review")}
            />
            <Check
              label="Project work"
              checked={studyStyle.goal.includes("Project work")}
              onChange={() => toggleOption("goal", "Project work")}
            />
            <Check
              label="Accountability group"
              checked={studyStyle.goal.includes("Accountability group")}
              onChange={() => toggleOption("goal", "Accountability group")}
            />
          </FormSection>

          <textarea
            placeholder="Add any additional preferences here..."
            value={studyStyle.notes}
            onChange={(e) =>
              setProfile((prev) => ({
                ...prev,
                studyStyle: {
                  ...prev.studyStyle,
                  notes: e.target.value,
                },
              }))
            }
          />

          <button className="primaryBtn" onClick={handleSave}>
            {studyStyle.saved ? "Save changes" : "Save study style"}
          </button>
        </div>
      </div>
    </section>
  );
}

function HomePage({ setPage, user, profile, setMatchedGroups, handleSignOut }) {
  // Find groups based on profile and study style
  const findGroups = async () => {
    const groupSnap = await getDocs(collection(db, "groups"));

    const allGroups = groupSnap.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }));

    const matches = allGroups.filter((group) => {
      const sameMajor =
        profile.major &&
        group.major?.toLowerCase().includes(profile.major.toLowerCase());

      const sameGoal =
        group.goal && profile.studyStyle.goal.includes(group.goal);

      const sameEnvironment =
        group.environment &&
        profile.studyStyle.environment.includes(group.environment);

      return sameMajor || sameGoal || sameEnvironment;
    });

    setMatchedGroups(matches);
    setPage("findGroup");
  };

  return (
    <section className="page">
      <SimpleHeader setPage={setPage} handleSignOut={handleSignOut} />

      <div className="homeGrid">
        <div className="mainCard">
          <p className="smallTag">Dashboard</p>
          <h1>Find your study group for STEM success</h1>

          {user?.email && (
            <p className="signedInText">Signed in as {user.email}</p>
          )}

          <p className="description">
            Find groups based on your major, study style, and study goals.
          </p>

          <div className="groupActions">
            <button className="primaryBtn" onClick={findGroups}>
              Find a study group
            </button>
            <button
              className="secondaryBtn"
              onClick={() => setPage("createGroup")}
            >
              Create a study group
            </button>
          </div>
        </div>

        <SuggestedGroups />
      </div>
    </section>
  );
}

function SuggestedGroups() {
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    // Load groups when dashboard appears
    async function loadGroups() {
      const groupSnap = await getDocs(collection(db, "groups"));

      const allGroups = groupSnap.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setGroups(allGroups);
    }

    loadGroups();
  }, []);

  return (
    <div className="groupsCard">
      <h2>Suggested groups</h2>

      {groups.length === 0 ? (
        <p className="emptyText">
          No groups yet. Create the first group or find groups after others
          join.
        </p>
      ) : (
        groups.slice(0, 3).map((group) => (
          <div className="groupItem" key={group.id}>
            <h3>{group.name}</h3>
            <p>
              {group.major} · {group.environment} · {group.goal}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

function CreateGroupPage({ setPage, user, profile, handleSignOut }) {
  const [name, setName] = useState("");
  const [major, setMajor] = useState(profile.major);
  const [environment, setEnvironment] = useState(
    profile.studyStyle.environment[0] || ""
  );
  const [goal, setGoal] = useState(profile.studyStyle.goal[0] || "");
  const [description, setDescription] = useState("");

  // Create a new group document in Firestore
  const createGroup = async () => {
    if (!name || !major) return;

    await addDoc(collection(db, "groups"), {
      name,
      major,
      environment,
      goal,
      description,
      creator: user?.email || "Unknown user",
      creatorUid: user?.uid || "",
      members: 1,
      createdAt: Date.now(),
    });

    setPage("home");
  };

  return (
    <section className="page">
      <SimpleHeader setPage={setPage} handleSignOut={handleSignOut} />

      <div className="formPage">
        <div>
          <p className="smallTag">Create group</p>
          <h1>Create a study group</h1>
          <p className="description">
            Groups you create will be saved to Firestore and can appear in
            matching results.
          </p>
        </div>

        <div className="formCard">
          <label className="fieldLabel">Group name</label>
          <input
            className="textInput"
            placeholder="Example: HCDE Project Study Group"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="fieldLabel">Major / Subject</label>
          <input
            className="textInput"
            placeholder="Example: HCDE"
            value={major}
            onChange={(e) => setMajor(e.target.value)}
          />

          <label className="fieldLabel">Environment</label>
          <input
            className="textInput"
            placeholder="Example: Library"
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
          />

          <label className="fieldLabel">Study goal</label>
          <input
            className="textInput"
            placeholder="Example: Project work"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />

          <label className="fieldLabel">Description</label>
          <textarea
            placeholder="Describe what this group is for..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <button className="primaryBtn" onClick={createGroup}>
            Save group
          </button>
        </div>
      </div>
    </section>
  );
}

function FindGroupPage({ setPage, profile, matchedGroups, handleSignOut }) {
  return (
    <section className="page">
      <SimpleHeader setPage={setPage} handleSignOut={handleSignOut} />

      <div className="calendarPage">
        <div className="mainCard">
          <p className="smallTag">Matched groups</p>
          <h1>Study groups for {profile.major || "your profile"}</h1>

          {matchedGroups.length === 0 ? (
            <p className="description">
              No matching groups yet. Try creating a group first or adding more
              profile details.
            </p>
          ) : (
            matchedGroups.map((group) => (
              <div className="groupItem" key={group.id}>
                <h3>{group.name}</h3>
                <p>
                  {group.major} · {group.environment} · {group.goal}
                </p>
                <p>{group.description}</p>
              </div>
            ))
          )}

          <button
            className="secondaryBtn"
            onClick={() => setPage("createGroup")}
          >
            Create a new group
          </button>
        </div>
      </div>
    </section>
  );
}

function CalendarPage({
  setPage,
  user,
  calendarEvents,
  setCalendarEvents,
  handleSignOut,
}) {
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [sessionLocation, setSessionLocation] = useState("");

  useEffect(() => {
    // Load saved calendar events for this user
    async function loadCalendarEvents() {
      if (!user?.uid) return;

      const eventSnap = await getDocs(
        collection(db, "users", user.uid, "calendarEvents")
      );

      const savedEvents = eventSnap.docs.map((docItem) => ({
        id: docItem.id,
        ...docItem.data(),
      }));

      setCalendarEvents(savedEvents);
    }

    loadCalendarEvents();
  }, [user, setCalendarEvents]);

  // Add a new calendar event
  const addCalendarEvent = async () => {
    if (!sessionTitle || !sessionDate) return;

    const newEvent = {
      title: sessionTitle,
      date: sessionDate,
      time: sessionTime,
      location: sessionLocation,
      createdAt: Date.now(),
    };

    const docRef = await addDoc(
      collection(db, "users", user.uid, "calendarEvents"),
      newEvent
    );

    setCalendarEvents([
      ...calendarEvents,
      {
        id: docRef.id,
        ...newEvent,
      },
    ]);

    setSessionTitle("");
    setSessionDate("");
    setSessionTime("");
    setSessionLocation("");
  };

  return (
    <section className="page">
      <SimpleHeader setPage={setPage} handleSignOut={handleSignOut} />

      <div className="calendarPage">
        <div className="mainCard">
          <p className="calendarBigTitle">Calendar</p>
          <h1 className="calendarSubTitle">Your study schedule</h1>

          <p className="description">
            Add study sessions, project meetings, or exam review times to your
            calendar.
          </p>

          <div className="calendarForm">
            <input
              className="textInput"
              placeholder="Session title"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
            />

            <input
              className="textInput"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
            />

            <input
              className="textInput"
              type="time"
              value={sessionTime}
              onChange={(e) => setSessionTime(e.target.value)}
            />

            <input
              className="textInput"
              placeholder="Location"
              value={sessionLocation}
              onChange={(e) => setSessionLocation(e.target.value)}
            />

            <button className="primaryBtn" onClick={addCalendarEvent}>
              Add date
            </button>
          </div>

          <div className="calendarBox">
            {calendarEvents.length === 0 ? (
              <p>Upcoming sessions will appear here.</p>
            ) : (
              calendarEvents.map((event) => (
                <div className="calendarEvent" key={event.id}>
                  <h3>{event.title}</h3>
                  <p>
                    {event.date} {event.time && `· ${event.time}`}
                  </p>
                  <p>{event.location || "No location added"}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FormSection({ title, children }) {
  return (
    <div className="formSection">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Check({ label, checked, onChange }) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

export default App;
