import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Keyboard,
} from "react-native";

const API_URL = "https://jsonplaceholder.typicode.com/posts";

export default function App() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);
  const [listError, setListError] = useState(null);

  const [formMessage, setFormMessage] = useState(null);

  const [postToConfirmDelete, setPostToConfirmDelete] = useState(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    setListError(null);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`Błąd serwera: ${response.status}`);
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setListError(err.message || "Wystąpił błąd sieci podczas pobierania.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    setFormMessage(null);

    if (!title.trim() || !body.trim() || !userId.trim()) {
      setFormMessage({
        type: "error",
        text: "⚠️ Błąd walidacji: Wszystkie pola formularza muszą być wypełnione!",
      });
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=UTF-8" },
        body: JSON.stringify({
          title,
          body,
          userId: parseInt(userId, 10),
        }),
      });

      if (!response.ok)
        throw new Error(`Błąd serwera HTTP: ${response.status}`);
      const newPost = await response.json();

      const uniqueNewPost = { ...newPost, id: Date.now() };

      setFormMessage({
        type: "success",
        text: `✅ Sukces! Post wysłany prawidłowo. Otrzymane ID: ${newPost.id}`,
      });

      setPosts((prevPosts) => [uniqueNewPost, ...prevPosts]);

      setTitle("");
      setBody("");
      setUserId("");
      Keyboard.dismiss();
    } catch (err) {
      setFormMessage({
        type: "error",
        text: `⚠️ Błąd zapisu: ${err.message || "Brak połączenia z siecią."}`,
      });
    } finally {
      setIsSending(false);
    }
  };

  const executeDelete = async (postId) => {
    setDeletingIds((prev) => [...prev, postId]);
    try {
      const apiPostId = postId > 100 ? 1 : postId;

      const response = await fetch(`${API_URL}/${apiPostId}`, {
        method: "DELETE",
      });

      if (!response.ok)
        throw new Error(`Nie udało się usunąć: ${response.status}`);

      setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
      setPostToConfirmDelete(null);
    } catch (err) {
      setFormMessage({
        type: "error",
        text: `⚠️ Nie udało się usunąć posta: ${err.message}`,
      });
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== postId));
    }
  };

  const renderPostItem = ({ item }) => {
    const isThisItemDeleting = deletingIds.includes(item.id);
    const isConfirming = postToConfirmDelete === item.id;

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <Text style={styles.postMeta}>
            ID: {item.id} | User ID: {item.userId}
          </Text>

          {isConfirming ? (
            <View style={styles.confirmContainer}>
              <Text style={styles.confirmText}>Na pewno?</Text>
              <Pressable
                style={[styles.inlineButton, styles.yesButton]}
                onPress={() => executeDelete(item.id)}
                disabled={isThisItemDeleting}
              >
                {isThisItemDeleting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.inlineButtonText}>Tak</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.inlineButton, styles.noButton]}
                onPress={() => setPostToConfirmDelete(null)}
                disabled={isThisItemDeleting}
              >
                <Text style={styles.inlineButtonText}>Nie</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.deleteButtonPressed,
              ]}
              onPress={() => setPostToConfirmDelete(item.id)}
            >
              <Text style={styles.deleteButtonText}>Usuń</Text>
            </Pressable>
          )}
        </View>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postBody}>{item.body}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Dodaj nowy post</Text>

        {formMessage && (
          <View
            style={[
              styles.messageBanner,
              formMessage.type === "error"
                ? styles.errorBanner
                : styles.successBanner,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                formMessage.type === "error"
                  ? styles.errorTextInline
                  : styles.successTextInline,
              ]}
            >
              {formMessage.text}
            </Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Tytuł posta"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Treść posta"
          value={body}
          onChangeText={setBody}
          multiline
          numberOfLines={3}
        />
        <TextInput
          style={styles.input}
          placeholder="User ID (liczba)"
          value={userId}
          onChangeText={setUserId}
          keyboardType="numeric"
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            isSending && styles.buttonDisabled,
          ]}
          onPress={handleCreatePost}
          disabled={isSending}
        >
          <Text style={styles.buttonText}>
            {isSending ? "Wysyłanie..." : "Wyślij na serwer"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.divider} />

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>
          Pobrane posty z API ({posts.length})
        </Text>

        {isLoading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.infoText}>Ładowanie danych...</Text>
          </View>
        ) : listError ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>⚠️ {listError}</Text>
            <Pressable style={styles.retryButton} onPress={fetchPosts}>
              <Text style={styles.retryButtonText}>Spróbuj ponownie</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPostItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.infoText}>Brak postów do wyświetlenia.</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  mainTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 15,
    color: "#1A1A1A",
  },
  divider: { height: 1, backgroundColor: "#E1E6EB", marginVertical: 10 },

  formContainer: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    marginHorizontal: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    color: "#333333",
  },

  messageBanner: { padding: 10, borderRadius: 6, marginBottom: 12 },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  successBanner: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  messageText: { fontSize: 13, fontWeight: "500" },
  errorTextInline: { color: "#DC2626" },
  successTextInline: { color: "#16A34A" },

  input: {
    backgroundColor: "#F8F9FA",
    borderWidth: 1,
    borderColor: "#DDE2E5",
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  textArea: { height: 60, textAlignVertical: "top" },
  button: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  buttonPressed: { backgroundColor: "#0056B3" },
  buttonDisabled: { backgroundColor: "#A0C5F7" },
  buttonText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },

  listContainer: { flex: 1, marginHorizontal: 15, marginTop: 5 },
  listContent: { paddingBottom: 20 },
  postCard: {
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  postMeta: { fontSize: 11, color: "#8E8E93", fontWeight: "600", flex: 1 },

  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#FF3B30",
  },
  deleteButtonPressed: { backgroundColor: "#FFEBEA" },
  deleteButtonText: { color: "#FF3B30", fontSize: 12, fontWeight: "600" },

  confirmContainer: { flexDirection: "row", alignItems: "center" },
  confirmText: {
    fontSize: 12,
    marginRight: 6,
    color: "#333",
    fontWeight: "500",
  },
  inlineButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 4,
    minWidth: 35,
    alignItems: "center",
  },
  yesButton: { backgroundColor: "#FF3B30" },
  noButton: { backgroundColor: "#8E8E93" },
  inlineButtonText: { color: "#FFF", fontSize: 11, fontWeight: "700" },

  postTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1C1C1E",
    marginBottom: 6,
  },
  postBody: { fontSize: 13, color: "#48484A", lineHeight: 18 },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  infoText: { marginTop: 10, color: "#666", fontSize: 14 },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: { color: "#FFF", fontWeight: "600" },
});
