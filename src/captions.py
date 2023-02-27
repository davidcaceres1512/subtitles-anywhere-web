import subprocess
import os
import argparse
import glob     #library to find files recursively using Python 
from stable_whisper import load_model
from stable_whisper import stabilize_timestamps
from stable_whisper import results_to_sentence_srt
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
import ISO369
from tqdm import tqdm
from pytube import YouTube

def validateVideo(videoFile):
    try:
        with open(videoFile, 'r') as f:
            pass
    except FileNotFoundError:
        print("Video file does not exist")
        exit()

def video2mp3(videoFile, output_ext="mp3"):
    filename, ext = os.path.splitext(videoFile)
    subprocess.call(["ffmpeg", "-y", "-i", videoFile, f"{filename}.{output_ext}"], 
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.STDOUT)
    return f"{filename}.{output_ext}"


def transcribe(audioFile, modelValue, output_ext="srt"):
    global results
    filename, ext = os.path.splitext(audioFile)
    model = load_model(modelValue)
    options = dict(beam_size=5, best_of=5)
    translate_options = dict(task="translate", **options)
    results = model.transcribe(audioFile, language='english')
    stab_segments = results['segments']
    first_segment_word_timestamps = stab_segments[0]['whole_word_timestamps']

    #get token timestamps that adhere more to the top prediction
    stab_segments = stabilize_timestamps(results, top_focus=True)

    # sentence/phrase-level
    results_to_sentence_srt(results, f"{filename}.{output_ext}")

def translateSubs(audioFile, output_ext="srt", lang="es", APITrans="googletrans"):
    filename, ext = os.path.splitext(audioFile)
    print("translatesubs " + f"\"{filename}.{output_ext}\" " + f"\"{filename}_{lang}.{output_ext}\" " + "--to_lang "+ str(lang) + " --translator " + APITrans+ " --separator \" $$$ \"")
    subprocess.call("translatesubs " + f"\"{filename}.{output_ext}\" " + f"\"{filename}_{lang}.{output_ext}\" " + "--to_lang "+ str(lang) + " --translator " + APITrans)

def translateM2M100(text, tokenizer, model_tr, src_lang='en', tr_lang='es'):
    tokenizer.src_lang = src_lang
    encoded_en = tokenizer(text, return_tensors="pt", padding=True)
    generated_tokens = model_tr.generate(**encoded_en, forced_bos_token_id=tokenizer.get_lang_id(tr_lang))
    return tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)

def translateNLLB(audioFile, output_ext="srt", lang="es"):
    filename, ext = os.path.splitext(audioFile)
    data_into_list_raw=[]
    index=0
    # opening the file in read mode
    File = open(f"{filename}.{output_ext}", "r")
    dataFile = File.read()
    data_into_list = dataFile.split("\n")
    #print(data_into_list)
    File.close()

    for x in range(2, len(data_into_list), 4):
        data_into_list_raw.append(data_into_list[x])

    respTranslator=translator(data_into_list_raw)
    values = [i['translation_text'] for i in respTranslator]
    #print(values)

    for x in range(2, len(data_into_list), 4):
        data_into_list[x]=values[index]
        print(values[index])
        index=index+1

    with open(f"{filename}_es.{ext}", 'w') as fp:
        for item in data_into_list:
            fp.write("%s\n" % item)

parser = argparse.ArgumentParser(prog = 'AI Captions', description = 'Create captions for videos using AI.')
parser.add_argument("-v", "--video", help="The video file to add captions", required=False, type=str)
parser.add_argument("-d", "--directory", help="The directory where is located the course to generate captions", required=False, type=str)
parser.add_argument("-u", "--url", help="The URL video", required=False, type=str)
parser.add_argument("-m", "--model", help="The model of Whisper. example: tiny.en, base.en, small.en", required=False, type=str, default="base.en")
parser.add_argument("-l", "--lang", help="language caption translator, only is valid iso639-1 language code", required=False, type=str, nargs='*', default=["es", "fr", "hi"])
parser.add_argument("-t", "--translator", help="API translator. example: googletrans, NLLB", required=False, type=str, default="googletrans")
args = parser.parse_args()
videoFile       = args.video
directoryCourse = args.directory
modelWhisper    = args.model
langTransSub    = args.lang
APITranslator   = args.translator
UrlYT           = args.url

if UrlYT!=None:
    try: 
        yt = YouTube(str(UrlYT))
    except: 
        print("Connection Error") #to handle exception 

for i in range(len(langTransSub)):
    if str(langTransSub[i]) in ISO369.LANG_ISO_369_1:
        print("the caption language to be translate is: "+ISO369.LANG_ISO_369_1[str(langTransSub[i])])
        pass
    else:
        print("the language \"" + str(langTransSub[i]) + "\" is incorrect format, use an ISO369-1 format!")
        exit()

results = dict()

model = AutoModelForSeq2SeqLM.from_pretrained("facebook/nllb-200-distilled-600M")
tokenizer = AutoTokenizer.from_pretrained("facebook/nllb-200-distilled-600M")

translator = pipeline('translation', model=model, tokenizer=tokenizer, src_lang="eng_Latn", tgt_lang="spa_Latn", max_length = 400)

def main1():
    validateVideo(videoFile)
    print("Extracting audio from video \""+videoFile+"\"")
    audioFile = video2mp3(videoFile)
    transcribe(audioFile, modelWhisper)
    if APITranslator!="NLLB":
        for i in tqdm(range(len(langTransSub))):
            translateSubs(audioFile, lang=str(langTransSub[i]), APITrans=APITranslator)
    else:
        translateNLLB(audioFile)
    os.remove(audioFile)

def main2():
    videoFiles = glob.glob(directoryCourse+'/**/*.mp4', recursive = True)
    for videoFile in videoFiles:
        validateVideo(videoFile)
        print("Extracting audio from video \""+videoFile+"\"")
        audioFile = video2mp3(videoFile)
        transcribe(audioFile, modelWhisper)
        if APITranslator!="NLLB":
            for i in tqdm(range(len(langTransSub))):
                translateSubs(audioFile, lang=str(langTransSub[i]), APITrans=APITranslator)
        else:
            translateNLLB(audioFile)
        os.remove(audioFile)

if __name__ == "__main__":
    if directoryCourse==None:
        #python captions.py -v "C:/Users/realf/Downloads/Embedded Systems Design Patterns From Ground Up/2. Getting Started -  Th First Class ADT/3. Coding   Implementing the Device Interface file.mp4"
        #python captions.py -m "small.en" -v "C:/Users/realf/Downloads/Embedded Systems Design Patterns From Ground Up/2. Getting Started -  Th First Class ADT/3. Coding   Implementing the Device Interface file.mp4"
        #python captions.py -l es -t googletrans -v "C:/Users/realf/Downloads/Embedded Systems Design Patterns From Ground Up/2. Getting Started -  Th First Class ADT/3. Coding   Implementing the Device Interface file.mp4"
        #python captions.py -l es zh-cn fr -t googletrans -v "C:/Users/realf/Downloads/Embedded Systems Design Patterns From Ground Up/2. Getting Started -  Th First Class ADT/3. Coding   Implementing the Device Interface file.mp4"
        #(not supported yet) python captions.py -l es -t M2M100 -v "C:/Users/realf/Downloads/Embedded Systems Design Patterns From Ground Up/2. Getting Started -  Th First Class ADT/3. Coding   Implementing the Device Interface file.mp4"
        #python captions.py -l es -t NLLB -v "C:/Users/realf/Downloads/Embedded Systems Design Patterns From Ground Up/2. Getting Started -  Th First Class ADT/3. Coding   Implementing the Device Interface file.mp4"
        main1()
    else:
        #python captions.py -d "C:/Users/realf/Downloads/Embedded Systems Design Patterns From Ground Up"
        #python captions.py -m "small.en" -d "C:/Users/realf/Downloads/Embedded Systems Design Patterns From Ground Up"
        main2()








