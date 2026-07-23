import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from textblob import TextBlob
import spacy
import joblib
import re

# Download required NLTK data
nltk.download('punkt', quiet=True)
nltk.download('punkt_tab', quiet=True)
nltk.download('stopwords', quiet=True)

# Load spaCy model with word vectors
try:
    nlp = spacy.load('en_core_web_md')  # Try loading medium model with word vectors
except:
    try:
        nlp = spacy.load('en_core_web_sm')  # Fallback to small model
        print("Warning: Using small model without word vectors. Similarity scores may be less accurate.")
    except OSError:
        nlp = spacy.blank("en")
        nlp.add_pipe("sentencizer")
        print("Warning: No spaCy model installed; using the safe blank English pipeline.")

class TextPreprocessor:
    def __init__(self):
        self.stop_words = set(stopwords.words('english'))

    def preprocess_text(self, text):
        # Convert to lowercase
        text = text.lower()

        # Remove special characters and digits
        text = re.sub(r'[^a-zA-Z\s]', '', text)

        # Tokenize
        tokens = word_tokenize(text)

        # Remove stopwords
        tokens = [word for word in tokens if word not in self.stop_words]

        return ' '.join(tokens)

    def extract_features(self, text):
        """Extract essential features from text."""
        doc = nlp(text)
        words = text.split()
        sentences = list(doc.sents)

        features = {
            # Basic metrics
            'word_count': len(words),
            'sentence_count': len(sentences),

            # Content features
            'technical_terms': len([word for word in words if word.lower() in [
                'algorithm', 'implementation', 'architecture', 'optimization', 'framework',
                'design', 'pattern', 'system', 'database', 'api', 'code', 'software',
                'development', 'testing', 'debugging', 'performance', 'security',
                'scalability', 'maintainability', 'microservices', 'cloud', 'container',
                'kubernetes', 'docker', 'aws', 'azure', 'gcp', 'rest', 'graphql',
                'ci/cd', 'devops', 'agile', 'scrum', 'git', 'jenkins', 'monitoring',
                'logging', 'metrics', 'analytics', 'machine learning', 'ai', 'ml',
                'data science', 'big data', 'hadoop', 'spark', 'kafka', 'redis',
                'elasticsearch', 'mongodb', 'postgresql', 'mysql', 'oracle'
            ]]),
            'has_example': any('example' in sent.text.lower() or 'instance' in sent.text.lower() or 'case' in sent.text.lower() or 'scenario' in sent.text.lower() for sent in sentences),
            'has_explanation': any('because' in sent.text.lower() or 'reason' in sent.text.lower() or 'since' in sent.text.lower() or 'therefore' in sent.text.lower() or 'thus' in sent.text.lower() or 'consequently' in sent.text.lower() for sent in sentences),

            # Quality indicators
            'has_technical_depth': any(term in text.lower() for term in [
                'implementation', 'architecture', 'optimization', 'algorithm',
                'design pattern', 'data structure', 'complexity', 'efficiency',
                'time complexity', 'space complexity', 'big o', 'o(n)', 'o(1)',
                'distributed system', 'microservices', 'containerization',
                'load balancing', 'caching', 'database indexing', 'query optimization'
            ]),
            'has_concrete_example': any('for example' in sent.text.lower() or 'instance' in sent.text.lower() or 'case study' in sent.text.lower() or 'scenario' in sent.text.lower() or 'use case' in sent.text.lower() for sent in sentences),
            'has_quantitative_info': any(char in text for char in ['%', '$', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'])
        }

        return features

class InterviewAnalyzer:
    """A class to analyze interview responses using machine learning and NLP techniques."""

    def __init__(self):
        """Initialize the analyzer by loading required models and resources."""
        # Load the trained model and vectorizer
        try:
            self.model = joblib.load('interview_model.joblib')
            self.vectorizer = joblib.load('vectorizer.joblib')
            self.scaler = joblib.load('scaler.joblib')
            self.feature_names = joblib.load('feature_names.joblib')
            print("Successfully loaded model and components.")
        except Exception as e:
            print(f"Error loading model files: {str(e)}")
            print("Please run train_model.py first.")
            self.model = None
            self.vectorizer = None
            self.scaler = None
            self.feature_names = None

        self.preprocessor = TextPreprocessor()

    def preprocess_text(self, text):
        """Preprocess the input text for analysis."""
        return self.preprocessor.preprocess_text(text)

    def calculate_similarity(self, question, response):
        """Calculate semantic similarity between question and response."""
        try:
            # Process both texts using spaCy
            doc1 = nlp(question)
            doc2 = nlp(response)

            # Calculate similarity score
            similarity = doc1.similarity(doc2)

            # Ensure similarity is between 0 and 1
            return max(0.0, min(1.0, similarity))
        except Exception as e:
            print(f"Error calculating similarity: {str(e)}")
            return 0.5  # Return neutral similarity on error

    def analyze_structure(self, response):
        """Analyze the structure and organization of the response."""
        try:
            # Process response with spaCy
            doc = nlp(response)
            response_lower = response.lower()
            sentences = list(doc.sents)

            # 1. Has intro / opening — search in first sentence or beginning of text
            intro_keywords = [
                'first', 'to begin', 'let me', 'in this', 'when', 'to implement',
                'for this', 'one of', 'the key', 'a common', 'an important',
                'i would', 'my approach', 'the main', 'typically', 'generally',
                'i think', 'i believe', 'sure', 'great question', 'absolutely',
                'of course', 'certainly', 'so ', 'well ', 'basically', 'essentially',
                'the way', 'in order', 'to answer', 'when it comes', 'this is',
                'there are', 'we can', 'you can', 'it is', "it's"
            ]
            first_sentence = sentences[0].text.lower() if sentences else response_lower[:150]
            has_intro = any(kw in first_sentence for kw in intro_keywords)

            # 2. Has conclusion / summary — search in last sentence or full text
            conclusion_keywords = [
                'in conclusion', 'to summarize', 'finally', 'therefore', 'thus',
                'as a result', 'in summary', 'overall', 'to wrap up', 'in the end',
                'lastly', 'to conclude', 'in short', 'in brief', 'in total',
                'hope this', 'this is how', 'this approach', 'this way',
                'that is why', 'this ensures', 'this helps', 'this allows',
                'this means', 'end result', 'key takeaway', 'to sum up'
            ]
            last_sentence = sentences[-1].text.lower() if sentences else ''
            has_conclusion = (
                any(kw in last_sentence for kw in conclusion_keywords) or
                any(kw in response_lower for kw in conclusion_keywords)
            )

            # 3. Has transitions — search as substrings in the full response text
            #    (single-token iteration misses multi-word phrases like 'for example')
            transition_phrases = [
                'however', 'moreover', 'furthermore', 'additionally', 'consequently',
                'next', 'also', 'besides', 'after that', 'in addition',
                'on the other hand', 'for example', 'for instance', 'such as',
                'specifically', 'particularly', 'importantly', 'notably',
                'first', 'second', 'third', 'finally', 'lastly', 'then',
                'another', 'additionally', 'as well', 'not only', 'but also',
                'in contrast', 'on the contrary', 'as a result', 'therefore'
            ]
            has_transitions = any(phrase in response_lower for phrase in transition_phrases)

            # 4. Bonus: well-organized multi-sentence response or uses numbering/bullets
            has_multiple_sentences = len(sentences) >= 3
            has_numbering = bool(re.search(r'(\b(first|second|third|1\.|2\.|3\.|-\s|\*\s))', response_lower))

            # Weighted score: intro (25%), conclusion (25%), transitions (30%), length/structure (20%)
            score = (
                (0.25 if has_intro else 0.0) +
                (0.25 if has_conclusion else 0.0) +
                (0.30 if has_transitions else 0.0) +
                (0.10 if has_multiple_sentences else 0.0) +
                (0.10 if has_numbering else 0.0)
            )
            return max(0.0, min(1.0, score))
        except Exception as e:
            print(f"Error analyzing structure: {str(e)}")
            return 0.5  # Return neutral structure score on error

    def analyze_response(self, question, response):
        """Analyze a candidate's response to an interview question."""
        if self.model is None or self.vectorizer is None or self.scaler is None:
            return {
                'score': 0,
                'similarity': 0,
                'length_score': 0,
                'structure_score': 0,
                'feedback': "Model not loaded. Please run train_model.py first."
            }

        try:
            # Preprocess the response
            processed_response = self.preprocess_text(response)

            # Extract features
            features = self.preprocessor.extract_features(response)

            # Ensure features are in the same order as during training
            feature_values = [features[feature_name] for feature_name in self.feature_names]

            # Vectorize the response
            response_vector = self.vectorizer.transform([processed_response])

            # Combine text and numerical features
            X_features = np.array([feature_values])
            X_combined = np.hstack([response_vector.toarray(), X_features])

            # Scale features
            X_scaled = self.scaler.transform(X_combined)

            # Get model prediction
            prediction = self.model.predict(X_scaled)[0]
            probability = self.model.predict_proba(X_scaled)[0][1]

            # Calculate various scores
            similarity_score = self.calculate_similarity(question, response)
            structure_score = self.analyze_structure(response)

            # Calculate length score (optimal length between 50-200 words)
            word_count = len(response.split())
            length_score = 1.0 if 50 <= word_count <= 200 else max(0, 1 - abs(word_count - 125) / 125)

            # Calculate overall score
            overall_score = (probability * 0.4 + similarity_score * 0.3 + length_score * 0.2 + structure_score * 0.1) * 100

            # Generate feedback
            feedback = self.generate_feedback(probability, similarity_score, length_score, structure_score)

            return {
                'score': round(overall_score, 1),
                'similarity': round(similarity_score * 100, 1),
                'length_score': round(length_score * 100, 1),
                'structure_score': round(structure_score * 100, 1),
                'feedback': feedback
            }
        except Exception as e:
            print(f"Error analyzing response: {str(e)}")
            return {
                'score': 0,
                'similarity': 0,
                'length_score': 0,
                'structure_score': 0,
                'feedback': f"Error analyzing response: {str(e)}"
            }

    def generate_feedback(self, probability, similarity, length, structure):
        """Generate detailed feedback based on analysis scores."""
        feedback_parts = []

        # Content quality feedback
        if probability < 0.3:
            feedback_parts.append("Your response lacks technical depth. Try to include more specific technical details, implementation examples, and performance considerations.")
        elif probability < 0.6:
            feedback_parts.append("Your response has some technical content, but could benefit from more concrete examples, implementation details, and specific technical solutions.")
        else:
            feedback_parts.append("Good job providing technical depth, concrete examples, and implementation details in your response.")

        # Content relevance feedback
        if similarity < 0.3:
            feedback_parts.append("Your response seems to deviate from the question. Try to stay more focused on the specific technical aspects asked in the question.")
        elif similarity < 0.6:
            feedback_parts.append("Your response is somewhat relevant but could be more directly related to the technical question asked.")
        else:
            feedback_parts.append("Good job staying on topic and addressing the technical question directly.")

        # Length feedback
        if length < 0.3:
            feedback_parts.append("Your response is too brief. Try to provide more technical details, examples, and implementation considerations.")
        elif length > 0.8:
            feedback_parts.append("Your response is quite long. Consider being more concise while maintaining key technical points and examples.")

        # Structure feedback
        if structure < 0.3:
            feedback_parts.append("Your response could benefit from better organization. Try using a clear introduction, technical implementation details, and a conclusion.")
        elif structure < 0.6:
            feedback_parts.append("Your response has some structure, but could be better organized with clearer transitions between technical concepts.")
        else:
            feedback_parts.append("Good job organizing your response with clear structure and transitions between technical concepts.")

        # Best practices feedback
        if not any(term in ' '.join(feedback_parts).lower() for term in ['best practice', 'industry standard', 'recommended approach']):
            feedback_parts.append("Consider mentioning relevant industry best practices, standards, or recommended approaches to strengthen your response.")

        return " ".join(feedback_parts)
