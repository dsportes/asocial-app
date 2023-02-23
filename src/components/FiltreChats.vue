<template>
  <div>
    <q-input dense counter v-model="nom"
      label="Début du nom du contact"
      @keydown.enter.prevent="oknom" type="text" :hint="$t('entree')">
      <template v-slot:append>
        <span :class="nom.length === 0 ? 'disabled' : ''"><q-icon name="cancel" class="cursor-pointer"  @click="nom=''"/></span>
      </template>
    </q-input>

    <q-input dense counter v-model="txt"
      label="Texte dans les chats"
      @keydown.enter.prevent="oktxt" type="text" :hint="$t('entree')">
      <template v-slot:append>
        <span :class="nom.length === 0 ? 'disabled' : ''"><q-icon name="cancel" class="cursor-pointer"  @click="nom=''"/></span>
      </template>
    </q-input>

  </div>
</template>

<script>
import stores from "../stores/stores.mjs"

export default ({
  name: 'FiltreChats',

  data () {
    return {
      nom: '',
      txt: ''
    }
  },

  methods: {
    oknom () {
      console.log(this.nom)
      this.valider()
    },
    oktxt () {
      console.log(this.txt)
      this.valider()
    },
    valider () {
      this.fStore.setFChats({ nom: this.nom, txt: this.txt })
    }
  },

  setup () {
    const fStore = stores.filtre
    return {
      fStore
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
