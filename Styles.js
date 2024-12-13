import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    height: '33%',
  },
  backgroundImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  formContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 16,
    alignItems: 'center',
    marginTop: -30,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginTop: -50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 24,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    color: '#333',
    marginBottom: 4,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    paddingLeft: 8,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#ff4c4c',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  link: {
    color: '#ff4c4c',
    fontWeight: 'bold',
    marginTop: 12,
  },
  text: {
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },

  connectionStatus: {
    textAlign: "center",
    marginBottom: 10,
    fontSize: 12,
    color: "#666",
  },


});
