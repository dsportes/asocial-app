<template>
  <div v-if="nb" class='row q-gutter-xs titre-sm'>
    <div>{{$t('PNOauts', nb)}}</div>
    <div v-for="im in nSt.note.l" :key="im">
      <span class="bord cursor-pointer q-px-xs">
        <span v-if="ida(im)" class="cursor-pointer" @click="openCv(im)">{{nomC(im)}}</span>
        <span v-else>#{{im}}</span>
      </span>
    </div>
    <div v-if="autAvc" class="msg">{{$t('PNOauts2')}}</div>

    <q-dialog v-model="ui.d.ACVouvrir[idc]" persistent>
      <apercu-cv :cv="cv"/>
    </q-dialog>

  </div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuCv from '../dialogues/ApercuCv.vue'

export default {
  name: 'ListeAuts',

  props: { },

  components: { ApercuCv },

  computed: {
    nb () { return this.nSt.note.l.length },
  },

  data () {
    return {
      cv: null
    }
  },

  methods: {
    ida (im) { return this.session.compte.tid[im] },
    getCV (im) { 
      const ida = this.ida(im)
      return ida ? this.session.getCV(ida) : null
    }, 
    nomC (im) { return this.getCV(im).nomC },

    openCv (im) {
      this.cv = this.getCv(im)
      this.ui.oD('ACVouvrir', this.idc)
    }
  },

  setup () {
    const ui = stores.ui
    const idc = ui.getIdc()
    const session = stores.session
    const nSt = stores.note
    const gSt = stores.groupe
    const autAvc = ref(false)
    
    let b = false
    const egr = gSt.egr(nSt.note.id)
    if (egr) {
      nSt.note.l.forEach(im => { if (session.compte.mav.has(egr.groupe.tid[im])) b = true })
      autAvc.value = b
    }

    return {
      session, ui, idc, nSt, gSt, autAvc
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
