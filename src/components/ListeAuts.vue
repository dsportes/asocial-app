<template>
  <div class='row q-gutter-xs titre-md'>
    <div>{{$t('PNOauts', nSt.note.auts.length)}}</div>
    <div v-for="m in nSt.mbAuteurs" :key="m.na.id"
      class="bord cursor-pointer q-px-xs" @click="openCv(m.na.id)">
      {{m.na.nomc}}
    </div>

    <q-dialog v-model="opencv" persistent>
      <apercu-cv :id="id"/>
    </q-dialog>
  </div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuCv from '../components/ApercuCv.vue'
import { MD } from '../app/modele.mjs'

export default {
  name: 'ListeAuts',

  props: { },

  components: { ApercuCv },

  computed: {  },

  data () {
    return {
      id: 0
    }
  },

  methods: {
    openCv (id) {
      this.id = id
      this.ovopencv()
    }
  },

  setup () {
    const nSt = stores.note
    const opencv = ref(false)
    function ovopencv () { MD.oD(opencv) }

    return {
      opencv, ovopencv, MD, nSt
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
