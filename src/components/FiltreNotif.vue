<template>
  <div :class="'q-mb-sm full-width ' + dkli">
    <q-btn no-caps flat :label="$t('FInotif', [$t('gravite' + val)])">
    <q-menu anchor="bottom left" self="top left">
      <q-list style="min-width: 50px">
        <q-item clickable v-close-popup @click="val=0">
          <span class="fs-md text-italic">{{$t('gravite0')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=1">
          <notif-ico class="q-mr-sm" />
          <notif-ico class="q-mr-xs" gravite />
          <span class="fs-md text-italic">{{$t('gravite1')}}</span>
        </q-item>
        <q-item clickable v-close-popup @click="val=2">
          <notif-ico class="q-mr-sm" gravite />
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
import NotifIco from './NotifIco.vue'

export default ({
  name: 'FiltreNotif',

  props: { nom: String, idx: Number },

  components: { NotifIco },

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
    dkli () { return this.$q.dark.isActive ? (this.idx ? 'sombre' + (this.idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') }
  },

  setup (props) {
    const st = stores.filtre
    const val = ref('')
    const nom = toRef(props, 'nom')
    const x = st.filtre[nom.value]
    val.value = x && x.notif ? x.notif : 0
    return {
      st,
      val
    }
  }
})
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
