<template>
  <div v-if="nb" class='row q-gutter-xs titre-sm'>
    <div>{{$t('PNOauts', nb)}}</div>
    <div v-for="im in nSt.note.auts" :key="im">
      <span class="bord cursor-pointer q-px-xs">
        <span v-if="na(im)" class="cursor-pointer" @click="openCv(im)">{{na(im).nomc}}</span>
        <span v-else>#{{im}}</span>
      </span>
    </div>
    <div v-if="autAvc" class="titre-md text-bold text-italic text-warning">
      {{$t('PNOauts2')}}
    </div>

  </div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'

export default {
  name: 'ListeAuts',

  props: { },

  components: { },

  computed: {
    nb () { return this.nSt.note.auts.length }
  },

  data () {
    return {
    }
  },

  methods: {
    na (im) {
      const na = this.aSt.compte.naDeIdgIm(this.nSt.note.id, im)
      if (na) return na
      const m = this.gSt.getMembre(this.nSt.note.id, im)
      return m ? m.na : null
    },
    openCv (im) {
      this.ui.cveditionId = this.na(im).id
      this.ui.oD('ACVouvrir')
    }
  },

  setup () {
    const ui = stores.ui
    const nSt = stores.note
    const gSt = stores.groupe
    const aSt = stores.avatar
    const autAvc = ref(false)
    
    const ims = aSt.compte.imGroupe(nSt.note.id) // im des avatars du compte participant au groupe
    let b = false
    nSt.note.auts.forEach(im => { if (ims.has(im)) b = true})
    autAvc.value = b

    return {
      ui, nSt, gSt, aSt, autAvc
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 1px solid $grey-5
  border-radius: 5px
</style>
