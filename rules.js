rules_version = '2';
service cloud.firestore {
    match / databases / { database } / documents {

        // Admins
        match / admins / { adminId } {
      allow read, write: if request.auth.token.role == "admin";
        }

        // Propriétaires
        match / proprietaires / { proprioId } {
      allow read, write: if request.auth != null
                && request.auth.uid == proprioId
                && request.auth.token.role == "proprietaire";
        }

        // Chauffeurs
        match / chauffeurs / { chauffeurId } {
      allow read, write: if request.auth != null
                && request.auth.uid == chauffeurId
                && request.auth.token.role == "chauffeur";
        }

        // Courses, Days : lecture/écriture liée à leur chauffeur ou proprio
        match / courses / { courseId } {
      allow read, write: if request.auth != null
                && request.auth.token.role in ["proprietaire", "chauffeur"];
        }

        match / days / { dayId } {
      allow read, write: if request.auth != null
                && request.auth.token.role in ["proprietaire", "chauffeur"];
        }
    }
}
