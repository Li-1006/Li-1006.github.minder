import { useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "./firebase";
import "./App.css";

function App() {
  const [page, setPage] = useState("landing");
  const [user, setUser] = useState(null);

  const [studyStyle, setStudyStyle] = useState({
    environment: [],
    noise: [],
    goal: [],
    notes: "",
    saved: false,
  });

  return (
    <main className="app">
      {page === "landing" && <LandingPage setPage={setPage} />}
      {page === "account" && <AccountPage setPage={setPage} setUser={setUser} />}
      {page === "onboarding" && <OnboardingPage setPage={setPage} user={user} />}
      {page === "studyStyle" && (
        <StudyStylePage
          setPage={setPage}
          studyStyle={studyStyle}
          setStudyStyle={setStudyStyle}
        />
      )}
      {page === "home" && <HomePage setPage={setPage} user={user} />}
      {page === "profile" && (
        <ProfilePage setPage={setPage} user={user} studyStyle={studyStyle} />
      )}
      {page === "calendar" && <CalendarPage setPage={setPage} />}
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

function AuthHeader({ setPage }) {
  return (
    <header className="simpleHeader">
      <button type="button" onClick={() => setPage("landing")}>
        <MinderLogo />
      </button>
    </header>
  );
}

function SimpleHeader({ setPage }) {
  return (
    <header className="simpleHeader">
      <button type="button" onClick={() => setPage("home")}>
        <MinderLogo />
      </button>

      <nav className="topNav">
        <button type="button" onClick={() => setPage("home")}>Home</button>
        <button type="button" onClick={() => setPage("profile")}>Profile</button>
        <button type="button" onClick={() => setPage("calendar")}>Calendar</button>
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

function AccountPage({ setPage, setUser }) {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setErrorMessage("");
      setIsLoading(true);

      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;

      if (!googleUser.email || !googleUser.email.endsWith("@uw.edu")) {
        await signOut(auth);
        setErrorMessage("Please sign in with your UW email address.");
        setIsLoading(false);
        return;
      }

      setUser({
        name: googleUser.displayName || "UW Student",
        email: googleUser.email,
        photo: googleUser.photoURL || "",
      });

      setIsLoading(false);
      setPage("onboarding");
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
          Use your real UW Google account to connect your profile and start
          setting up your study preferences.
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

function OnboardingPage({ setPage, user }) {
  return (
    <section className="page">
      <AuthHeader setPage={setPage} />

      <div className="dashboard">
        <div className="sideCard">
          <h2>Welcome, {user?.name || "UW Student"}</h2>
          <p>Complete your profile so Minder can recommend better groups.</p>
          {user?.email && <p className="userEmail">{user.email}</p>}
        </div>

        <div className="mainCard">
          <h1>Profile setup</h1>

          <div className="taskItem">
            <span>+</span>
            <p>Add profile picture</p>
          </div>

          <div className="taskItem" onClick={() => setPage("studyStyle")}>
            <span>+</span>
            <p>Add study style</p>
          </div>

          <div className="taskItem">
            <span>+</span>
            <p>Add graduation date</p>
          </div>

          <div className="taskItem">
            <span>+</span>
            <p>Add weekly availability</p>
          </div>

          <button className="primaryBtn" onClick={() => setPage("studyStyle")}>
            Continue
          </button>
        </div>
      </div>
    </section>
  );
}

function StudyStylePage({ setPage, studyStyle, setStudyStyle }) {
  const toggleOption = (category, value) => {
    setStudyStyle((prev) => {
      const currentList = prev[category];
      const updatedList = currentList.includes(value)
        ? currentList.filter((item) => item !== value)
        : [...currentList, value];

      return {
        ...prev,
        [category]: updatedList,
      };
    });
  };

  const handleSave = () => {
    setStudyStyle((prev) => ({
      ...prev,
      saved: true,
    }));

    setPage("profile");
  };

  return (
    <section className="page">
      <SimpleHeader setPage={setPage} />

      <div className="formPage">
        <div>
          <p className="smallTag">Personalization</p>
          <h1>{studyStyle.saved ? "Edit your study style" : "Add your study style"}</h1>
          <p className="description">
            These preferences help Minder recommend groups that match how and
            where you like to study.
          </p>
        </div>

        <div className="formCard">
          <FormSection title="Environment preference">
            <Check label="Cafe" checked={studyStyle.environment.includes("Cafe")} onChange={() => toggleOption("environment", "Cafe")} />
            <Check label="Library" checked={studyStyle.environment.includes("Library")} onChange={() => toggleOption("environment", "Library")} />
            <Check label="Quiet room" checked={studyStyle.environment.includes("Quiet room")} onChange={() => toggleOption("environment", "Quiet room")} />
            <Check label="Other" checked={studyStyle.environment.includes("Other")} onChange={() => toggleOption("environment", "Other")} />
          </FormSection>

          <FormSection title="Noise level preference">
            <Check label="Silent study sessions" checked={studyStyle.noise.includes("Silent study sessions")} onChange={() => toggleOption("noise", "Silent study sessions")} />
            <Check label="Low conversation" checked={studyStyle.noise.includes("Low conversation")} onChange={() => toggleOption("noise", "Low conversation")} />
            <Check label="Group discussion" checked={studyStyle.noise.includes("Group discussion")} onChange={() => toggleOption("noise", "Group discussion")} />
            <Check label="Flexible" checked={studyStyle.noise.includes("Flexible")} onChange={() => toggleOption("noise", "Flexible")} />
          </FormSection>

          <FormSection title="Study goal">
            <Check label="Homework help" checked={studyStyle.goal.includes("Homework help")} onChange={() => toggleOption("goal", "Homework help")} />
            <Check label="Exam review" checked={studyStyle.goal.includes("Exam review")} onChange={() => toggleOption("goal", "Exam review")} />
            <Check label="Project work" checked={studyStyle.goal.includes("Project work")} onChange={() => toggleOption("goal", "Project work")} />
            <Check label="Accountability group" checked={studyStyle.goal.includes("Accountability group")} onChange={() => toggleOption("goal", "Accountability group")} />
          </FormSection>

          <textarea
            placeholder="Add any additional preferences here..."
            value={studyStyle.notes}
            onChange={(e) =>
              setStudyStyle((prev) => ({
                ...prev,
                notes: e.target.value,
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

function ProfilePage({ setPage, user, studyStyle }) {
  return (
    <section className="page">
      <SimpleHeader setPage={setPage} />

      <div className="profilePage">
        <div className="profileHeaderCard">
          <h1>Profile setup</h1>
          <p>
            Complete your profile so Minder can recommend study groups that
            match your schedule and study style.
          </p>

          {user?.email && (
            <p className="signedInText">Signed in as {user.email}</p>
          )}
        </div>

        <div className="profileSetupCard">
          <div className="profileTask">
            <span>+</span>
            <p>Add profile picture</p>
          </div>

          <div className="profileTask" onClick={() => setPage("studyStyle")}>
            <span>{studyStyle.saved ? "✓" : "+"}</span>
            <p>{studyStyle.saved ? "Edit study style" : "Add study style"}</p>
          </div>

          <div className="profileTask">
            <span>+</span>
            <p>Add graduation date</p>
          </div>

          <div className="profileTask">
            <span>+</span>
            <p>Add weekly availability</p>
          </div>
        </div>

        {studyStyle.saved && (
          <div className="profileSummaryCard">
            <h2>Saved study style</h2>
            <p><strong>Environment:</strong> {studyStyle.environment.join(", ") || "Not selected"}</p>
            <p><strong>Noise level:</strong> {studyStyle.noise.join(", ") || "Not selected"}</p>
            <p><strong>Study goal:</strong> {studyStyle.goal.join(", ") || "Not selected"}</p>
            <p><strong>Notes:</strong> {studyStyle.notes || "No notes added"}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function CalendarPage({ setPage }) {
  return (
    <section className="page">
      <SimpleHeader setPage={setPage} />

      <div className="calendarPage">
        <div className="mainCard">
          <p className="smallTag">Calendar</p>
          <h1>Your study schedule</h1>
          <p className="description">
            You do not have any study sessions scheduled yet.
          </p>

          <div className="calendarBox">
            <p>Upcoming sessions will appear here.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomePage({ setPage, user }) {
  return (
    <section className="page">
      <SimpleHeader setPage={setPage} />

      <div className="homeGrid">
        <div className="mainCard">
          <p className="smallTag">Dashboard</p>
          <h1>Find your study group for STEM success</h1>

          {user?.email && (
            <p className="signedInText">Signed in as {user.email}</p>
          )}

          <p className="description">
            You do not have any groups yet. Start by finding a recommended group
            or creating your own.
          </p>

          <div className="groupActions">
            <button className="primaryBtn">Find a study group</button>
            <button className="secondaryBtn">Create a study group</button>
          </div>
        </div>

        <div className="groupsCard">
          <h2>Suggested groups</h2>

          <div className="groupItem">
            <h3>CSE 142 Exam Prep</h3>
            <p>Library · Quiet study · 4 members</p>
          </div>

          <div className="groupItem">
            <h3>Math 126 Homework Group</h3>
            <p>Cafe · Discussion-based · 3 members</p>
          </div>

          <div className="groupItem">
            <h3>Physics Review</h3>
            <p>Online · Exam review · 5 members</p>
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
  