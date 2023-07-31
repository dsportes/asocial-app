<template>
  <div :class="'q-pa-xs full-width ' + dkli(0)">
    <q-btn no-caps flat :label="$t('FInotif', [$t('gravite' + val)])">
    <q-menu anchor="bottom left" self="top left">
      <q-list style="min-width: 50px">
        <q-item clickable v-close-popup @click="val=0">
          <span class="fs-md text-italic">{{$t('gravite0')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=1">
          <span class="fs-md text-italic">{{$t('gravite1')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=2">
          <span class="fs-md text-italic">{{$t('gravite2')}}</span>
        </q-item>
      </q-list>
    </q-menu>
    </q-btn>
  </div>
</template>

<script>
import stores from "../stores/stores.mjs"
import { ref, toRef } from 'vue'
import { dkli } from '../app/util.mjs'

export default ({
  name: 'FiltreNotif',

  props: { nom: String, idx: Number },

  components: { },

  data () {
    return {
    }
  },

  watch: {
    val (ap) {
      this.st.setFiltre(this.nom, 'notif', ap)
    }
  },

  computed: {
  },

  setup (props) {
    const st = stores.filtre
    const val = ref('')
    const nom = toRef(props, 'nom')
    const x = st.filtre[nom.value]
    val.value = x && x.notif ? x.notif : 0
    return {
      st, dkli,
      val
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
